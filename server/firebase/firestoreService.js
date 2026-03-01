import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, query, where, Timestamp, runTransaction, doc, getDoc, updateDoc, orderBy, limit as firestoreLimit, writeBatch } from "firebase/firestore";

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
            const prevTotalVotesAllTime = Number(userData.totalVotesAllTime) || prevTotalVotes;
            let nextFavoriteIdol = typeof userData.favoriteIdol === "string" ? userData.favoriteIdol : "";
            let nextFavoriteIdolVotes = Number(userData.favoriteIdolVotes) || 0;
            const currentFavoriteIdolKey = nextFavoriteIdol.toLowerCase().trim();

            const favoriteImage = (userData.favoriteImage && typeof userData.favoriteImage === "object") ? userData.favoriteImage : {};
            let nextFavoriteImageId = typeof favoriteImage.id === "string" ? favoriteImage.id : "";
            let nextFavoriteImageUrl = typeof favoriteImage.url === "string" ? favoriteImage.url : "";

            let nextFavoriteImageWidth = Number(favoriteImage.width);
            if (!Number.isFinite(nextFavoriteImageWidth) || nextFavoriteImageWidth < 0) {
                nextFavoriteImageWidth = 0;
            }

            let nextFavoriteImageHeight = Number(favoriteImage.height);
            if (!Number.isFinite(nextFavoriteImageHeight) || nextFavoriteImageHeight < 0) {
                nextFavoriteImageHeight = 0;
            }

            let nextFavoriteImageVotes = Number(favoriteImage.votes);
            if (!Number.isFinite(nextFavoriteImageVotes) || nextFavoriteImageVotes < 0) {
                nextFavoriteImageVotes = 0;
            }

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
                
                const imageWidth = Number(imageData.width);
                nextFavoriteImageWidth = Number.isFinite(imageWidth) && imageWidth > 0 ? imageWidth : 0;

                const imageHeight = Number(imageData.height);
                nextFavoriteImageHeight = Number.isFinite(imageHeight) && imageHeight > 0 ? imageHeight : 0;

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
                totalVotesAllTime: prevTotalVotesAllTime + 1,
                totalVotes: prevTotalVotes + 1,
                favoriteIdol: nextFavoriteIdol,
                favoriteIdolVotes: nextFavoriteIdolVotes,
                favoriteImage: {
                    id: nextFavoriteImageId,
                    url: nextFavoriteImageUrl,
                    width: nextFavoriteImageWidth,
                    height: nextFavoriteImageHeight,
                    votes: nextFavoriteImageVotes,
                }
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

export const getTopUsersByVotes = async (collectionName, sortField, limit = 10) => {
    try {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, orderBy(sortField, "desc"), firestoreLimit(limit));
        const snap = await getDocs(q);

        return snap.docs.map((doc) => {
            const data = doc.data();
            // strip sensitive fields before returning
            const { passwordHash, ...safeData } = data;
            return { id: doc.id, ...safeData };
        });
    } catch (err) {
        console.log(err.message);
        return null;
    }
}

const USER_VOTE_RESET = {
    totalVotes: 0,
    favoriteIdol: "",
    favoriteIdolVotes: 0,
    favoriteImage: {
        id: "",
        url: "",
        width: 0,
        height: 0,
        votes: 0,
    }
};

const appendDeleteSubcollectionDocsToBatch = async ({ usersCollectionName, userId, subcollectionName, pendingOps }) => {
    const subcollectionRef = collection(db, usersCollectionName, userId, subcollectionName);
    const subcollectionSnap = await getDocs(subcollectionRef);

    subcollectionSnap.forEach((subDoc) => {
        pendingOps.push({ type: "delete", ref: subDoc.ref });
    });

    return subcollectionSnap.size;
};

const commitPendingUserVoteResetOps = async (pendingOps, batchLimit = 450) => {
    let committedOps = 0;

    while (pendingOps.length > 0) {
        const batch = writeBatch(db);
        const chunk = pendingOps.splice(0, batchLimit);

        chunk.forEach((op) => {
            if (op.type === "delete") {
                batch.delete(op.ref);
                return;
            }

            if (op.type === "update") {
                batch.update(op.ref, op.data);
            }
        });

        await batch.commit();
        committedOps += chunk.length;
    }

    return committedOps;
};

export const resetCurrentMonthGlobalVotes = async (useTestCollection = false) => {
    try {
        const statsCollectionName = useTestCollection ? "test_stats" : "stats";
        const globalVotesRef = doc(db, statsCollectionName, "globalVotes");

        return await runTransaction(db, async (transaction) => {
            const globalVotesSnap = await transaction.get(globalVotesRef);
            const currentData = globalVotesSnap.exists() ? globalVotesSnap.data() : {};
            const totalVotesAllTime = Number(currentData.totalVotesAllTime) || Number(currentData.totalVotes) || 0;

            transaction.set(globalVotesRef, {
                totalVotes: 0,
                totalVotesAllTime,
                updatedAt: Timestamp.now(),
                lastMonthlyResetAt: Timestamp.now()
            }, { merge: true });

            return {
                statsCollectionName,
                totalVotesAllTime,
                globalVotesReset: true
            };
        });
    } catch (err) {
        console.log(err.message);
        return null;
    }
}

export const resetAllUsersVoteStats = async (useTestCollection = false) => {
    try {
        const usersCollectionName = useTestCollection ? "test_users" : "users";
        const usersRef = collection(db, usersCollectionName);
        const usersSnap = await getDocs(usersRef);

        if (usersSnap.empty) {
            return {
                usersUpdated: 0,
                idolVotesDeleted: 0,
                imageVotesDeleted: 0,
                writesCommitted: 0
            };
        }

        const pendingOps = [];
        let idolVotesDeleted = 0;
        let imageVotesDeleted = 0;

        for (const userDoc of usersSnap.docs) {
            // update top level user fields
            pendingOps.push({
                type: "update",
                ref: userDoc.ref,
                data: USER_VOTE_RESET
            });

            // delete idolVotes and imageVotes subcollections

            idolVotesDeleted += await appendDeleteSubcollectionDocsToBatch({
                usersCollectionName,
                userId: userDoc.id,
                subcollectionName: "idolVotes",
                pendingOps
            });

            imageVotesDeleted += await appendDeleteSubcollectionDocsToBatch({
                usersCollectionName,
                userId: userDoc.id,
                subcollectionName: "imageVotes",
                pendingOps
            });
        }

        const writesCommitted = await commitPendingUserVoteResetOps(pendingOps);

        return {
            usersUpdated: usersSnap.size,
            idolVotesDeleted,
            imageVotesDeleted,
            writesCommitted
        };
    } catch (err) {
        console.log(err.message);
        return null;
    }
}
