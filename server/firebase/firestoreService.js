import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, query, where, Timestamp, runTransaction, doc, getDoc, updateDoc } from "firebase/firestore";

/*
 * users
 */
export const saveUser = async (collectionName, userObj) => {
    try {
        const { usernameLower } = userObj;
        
        const collectionRef = collection(db, collectionName);
        const usernamesCollectionName = collectionName === "test_users" ? "test_usernames" : "usernames";
        
        // the usernames collection is a lock/index collection for uniqueness where each doc ID is usernameLower
        const usernameLockRef = doc(db, usernamesCollectionName, usernameLower); // usernameLower is the index

        // claim username and write user atomically to avoid duplcate usernames under concurrency
        const createdUser = await runTransaction(db, async (transaction) => {
            const usernameLockSnap = await transaction.get(usernameLockRef);
            if (usernameLockSnap.exists()) {
                return null;
            }

            const now = Timestamp.now();
            const userRef = doc(collectionRef);
            const newUser = { ...userObj, createdAt: now }

            transaction.set(userRef, newUser);
            transaction.set(usernameLockRef, {
                userId: userRef.id,
                createdAt: now,
            })

            return { id: userRef.id, ...newUser }
        })

        return createdUser;

    } catch (err) {
        console.log(err.message);
        return null;
    }
}

export const getUserByUserId = async(collectionName, userId) => {
    try {
        const userRef = doc(db, collectionName, userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return null;
        }

        return { id: userSnap.id, ...userSnap.data()}
        
    } catch (err) {
        console.log(err.message);
        return null;
    }
}

export const getUserByUsernameLower = async (collectionName, usernameLower) => {
    try {
        const usernamesCollectionName = collectionName === "test_users" ? "test_usernames" : "usernames";
        const usernameLockRef = doc(db, usernamesCollectionName, usernameLower);

        // get userId from username lock/index doc
        const usernameLockSnap = await getDoc(usernameLockRef);
        if (!usernameLockSnap.exists()) {
            return null;
        }

        const { userId } = usernameLockSnap.data();
        if (!userId) {
            return null;
        }

        // get user from userId
        const userRef = doc(db, collectionName, userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return null;
        }

        return { id: userSnap.id, ...userSnap.data() };
    } catch (err) {
        console.log(err.message);
        return null;
    }
}

// updates the nickname property of the given user and returns the updated user
export const updateNicknameByUserId = async (collectionName, userId, newNickname) => {
    const userRef = doc(db, collectionName, userId);
    let userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }

    await updateDoc(userRef, { nickname: newNickname })
    userSnap = await getDoc(userRef);
    return { id: userSnap.id, ...userSnap.data()};
}

// updates the user's total vote count and also their favorite image/idol
export const updateUserVotes = async (useTestCollection = true, userId, chosenImageId) => {
    try {
        const usersCollectionName = useTestCollection ? "test_users" : "users";
        const imagesCollectionName = useTestCollection ? "test_images" : "images";
        const userRef = doc(db, usersCollectionName, userId);
        const imageRef = doc(db, imagesCollectionName, chosenImageId);

        return await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("user doesn't exist");
            }

            const imageSnap = await transaction.get(imageRef);
            if (!imageSnap.exists()) {
                throw new Error("image doesn't exist");
            }

            const userData = userSnap.data();
            const imageData = imageSnap.data();

            const idolName = typeof imageData.idolName === "string" ? imageData.idolName.trim() : "";
            if (!idolName) {
                throw new Error("image is missing idolName");
            }

            // get necessary subcollection data idolVotes and imageVotes
            const idolVoteKey = idolName.toLowerCase();
            const idolVoteRef = doc(db, usersCollectionName, userId, "idolVotes", idolVoteKey);
            const imageVoteRef = doc(db, usersCollectionName, userId, "imageVotes", chosenImageId);

            const idolVoteSnap = await transaction.get(idolVoteRef);
            const imageVoteSnap = await transaction.get(imageVoteRef);

            const currentIdolVotes = idolVoteSnap.exists() ? Number(idolVoteSnap.data().votes) || 0 : 0;
            const currentImageVotes = imageVoteSnap.exists() ? Number(imageVoteSnap.data().votes) || 0 : 0;
            const nextIdolVotes = currentIdolVotes + 1;
            const nextImageVotes = currentImageVotes + 1;

            // get prev user stats
            const prevTotalVotes = Number(userData.totalVotes) || 0;
            let nextFavoriteIdol = typeof userData.favoriteIdol === "string" ? userData.favoriteIdol : "";
            let nextFavoriteIdolVotes = Number(userData.favoriteIdolVotes) || 0;
            const currentFavoriteIdolKey = nextFavoriteIdol.toLowerCase().trim();

            let nextFavoriteImageId = typeof userData.favoriteImageId === "string" ? userData.favoriteImageId : "";
            let nextFavoriteImageUrl = typeof userData.favoriteImageUrl === "string" ? userData.favoriteImageUrl : "";
            let nextFavoriteImageVotes = Number(userData.favoriteImageVotes) || 0;

            // if new idol votes > current favorite idol votes || same idol, update those existing user fields
            if (nextIdolVotes >= nextFavoriteIdolVotes || currentFavoriteIdolKey === idolVoteKey) {
                nextFavoriteIdol = idolName;
                nextFavoriteIdolVotes = nextIdolVotes;
            }

            if (nextImageVotes >= nextFavoriteImageVotes || nextFavoriteImageId === chosenImageId) {
                nextFavoriteImageId = chosenImageId;
                nextFavoriteImageUrl = (
                    (typeof imageData.firebaseUrl === "string" && imageData.firebaseUrl) ||
                    (typeof imageData.url === "string" && imageData.url) ||
                    ""
                );
                nextFavoriteImageVotes = nextImageVotes;
            }

            transaction.set(idolVoteRef, {
                idolName,
                votes: nextIdolVotes,
                updatedAt: Timestamp.now()
            }, { merge: true }) // without merge: true, set overwrites the whole document instead of just the specified fields

            transaction.set(imageVoteRef, {
                imageId: chosenImageId,
                idolName,
                votes: nextImageVotes,
                updatedAt: Timestamp.now()
            }, { merge: true })

            const userVoteStats = {
                totalVotes: prevTotalVotes + 1,
                favoriteIdol: nextFavoriteIdol,
                favoriteIdolVotes: nextFavoriteIdolVotes,
                favoriteImageId: nextFavoriteImageId,
                favoriteImageUrl: nextFavoriteImageUrl,
                favoriteImageVotes: nextFavoriteImageVotes
            }

            transaction.update(userRef, userVoteStats)

            return userVoteStats

        })

    } catch (err) {
        console.log(err.message);
        return { error: err.message };
    }

}



/*
 * images
 */
// Save one imageObj to Firestore
export const saveImage = async (collectionName, imageObj) => {
    try {
        const collectionRef = collection(db, collectionName);

        // check if an image with the same imageName already exists
        const q = query(collectionRef, where("imageName", "==", imageObj.imageName));
        const existingDocs = await getDocs(q);
    
        if (!existingDocs.empty) {
            // console.log(`Skipping duplicate: image with imageName ${imageObj.imageName} already exists`);
            return null;
        }
    
        imageObj.createdAt = Timestamp.now();
    
        const imageRef = await addDoc(collectionRef, imageObj);
        return { id: imageRef.id, ...imageObj };

    } catch (err) {
        console.log(err.message);
        return null;
    }
}

// Save multiple imageObj to firestore
export const saveManyImages = async (collectionName, imageObjects) => {
    try {
        const collectionRef = collection(db, collectionName);
    
        // existingDocsQuery.docs returns an array of all the docs, which all contain the .data attribute
        const existingDocsQuery = await getDocs(collectionRef);
        const existingDocsData = existingDocsQuery.docs.map((doc) => doc.data());
        const existingImageNames = new Set(existingDocsData.map((doc) => doc.imageName));
        const existingThumbnailUrls = new Set(existingDocsData.map((doc) => doc.thumbnailUrl));
    
        const savePromises = imageObjects.map(async (imageObj) => {
            if (existingImageNames.has(imageObj.imageName) || existingThumbnailUrls.has(imageObj.thumbnailUrl)) {
                // console.log(`Skipping duplicate: image with imageName ${imageObj.imageName} or thumbnailUrl ${thumbnailUrl} already exists`);
                return null;
            }
    
            imageObj.createdAt = Timestamp.now();
    
            const imageRef = await addDoc(collectionRef, imageObj);

            // so that we don't add duplicates within the same image input batch
            existingImageNames.add(imageObj.imageName);
            existingThumbnailUrls.add(imageObj.thumbnailUrl);
            return { id: imageRef.id, ...imageObj};
        })
    
        const results = await Promise.all(savePromises);

        // return just the images we've added
        return results.filter(image => image !== null); // filter out all the images that returned null due to already existing
        
    } catch (err) {
        console.log(err.message);
        return null;
    }
}
