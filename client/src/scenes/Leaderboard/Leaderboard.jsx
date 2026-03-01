import "./Leaderboard.css";
import React, { useState, useEffect } from "react";
import ImageWithPlaceholder from "../../components/ImageWithPlaceHolder/ImageWithPlaceholder.jsx";


const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredUserId, setHoveredUserId] = useState(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const topRowGradients = [
        ["#F7D46B", "#D89A2B"], // Gold
        ["#F1F1F1", "#BFC3C8"], // Silver
        ["#E0B07A", "#B87333"], // Bronze
    ];

   
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/users/leaderboard`);
                if (!res.ok) {
                    throw new Error("Failed to fetch leaderboard");
                }
                const data = await res.json();
                setUsers(data.leaderboard);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (isLoading) {
        return (
            <div id="leaderboard" className="flex flex-1 justify-center items-center">
                <p className="text-black dark:text-white">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div id="leaderboard" className="flex flex-1 justify-center items-center">
                <p className="text-black dark:text-white">{error}</p>
            </div>
        );
    }
     const handleMouseMove = (e) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };
    
    return (
        <div id="leaderboard" className="flex flex-1 justify-center items-start pt-12">
            <div className="flex flex-col gap-4 w-full max-w-md px-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl text-black dark:text-white text-center">Top Voters</h1>
                <div className="flex flex-col gap-2">
                {users.map((user, index) => {
                    const topRowGradient = topRowGradients[index] || null; // only nonnull for the first 3 rows
                    const isTopRow = Boolean(topRowGradient);
                    const primaryTextClass = isTopRow ? "text-[#1F1F1F]" : "text-black dark:text-white";
                    const secondaryTextClass = isTopRow ? "text-[#4F4F4F]" : "text-[#6c6c6c] dark:text-[#b8b8b8]";
                    const favoriteImage = user?.favoriteImage && typeof user.favoriteImage === "object" ? user.favoriteImage : null;
                    const favoriteImageUrl = favoriteImage?.url || "";
                    const favoriteImageVotes = Number(favoriteImage?.votes ?? 0) || 0;
                    const favoriteImageWidth = Number(favoriteImage?.width ?? 0) || 0;
                    const favoriteImageHeight = Number(favoriteImage?.height ?? 0) || 0;
                    // anything starting with -- is a CSS variable name
                    const rowStyle = topRowGradient ? {
                        "--row-gradient-start": topRowGradient[0],
                        "--row-gradient-end": topRowGradient[1],
                        "--row-delay": `${index * 0.11}s`,
                    } : undefined;

                    return (
                        <div
                            key={user.id}
                            onMouseEnter={() => setHoveredUserId(user.id)}
                            onMouseLeave={() => setHoveredUserId(null)}
                            onMouseMove={handleMouseMove}
                        >
                            {/* default row */}
                            <div
                                className={`leaderboard-row flex flex-row items-center justify-between hover:outline hover:outline-black hover:dark:outline-white px-4 py-3 rounded-lg m bg-[#F8F8D6] dark:bg-[#4C4C4C] ${topRowGradient ? "leaderboard-row--top" : ""}`}
                                style={rowStyle}
                            >
                                <div className="flex flex-row items-center gap-3">
                                    <span className={`${secondaryTextClass} text-sm w-5 text-right`}>{index + 1}</span>
                                    <span className={primaryTextClass}>{user.nickname}</span>
                                </div>
                                <span className={`tabular-nums ${primaryTextClass}`}>{user.totalVotes} vote{user.totalVotes !== 1 && "s"}</span>
                            </div>

                            {/* cursor-following popup */}
                            {hoveredUserId === user.id && (
                                <div
                                    className="leaderboard-popup fixed z-50 flex flex-col p-4 min-w-[14rem] gap-3 rounded-lg bg-[#F8F8D6]/[0.97] dark:bg-[#4C4C4C]/[0.97] shadow-2xl pointer-events-none"
                                    style={{ top: cursorPos.y + 16, left: cursorPos.x + 16 }}
                                >
                                    <div className="flex flex-col">
                                        <p className="text-base leading-tight text-black dark:text-white">{user.nickname}</p>
                                        <p className="text-xs leading-tight text-[#6c6c6c] dark:text-[#b8b8b8]">@{user.username}</p>
                                    </div>

                                    <hr className="border-0 border-t border-black dark:border-white" />

                                    <div className="flex flex-col text-sm leading-6">
                                        <div className="flex flex-row justify-between">
                                            <p className="text-[#6c6c6c] dark:text-[#b8b8b8]"># Votes (All time):</p>
                                            <p className="tabular-nums">{user.totalVotesAllTime || user.totalVotes}</p>
                                        </div>  
                                        <div className="flex flex-row justify-between">
                                            <p className="text-[#6c6c6c] dark:text-[#b8b8b8]"># Votes:</p>
                                            <p className="tabular-nums text-black dark:text-white">{user.totalVotes}</p>
                                        </div>
                                        <div className="flex flex-row justify-between">
                                            <p className="text-[#6c6c6c] dark:text-[#b8b8b8]">Favorite Idol:</p>
                                            <p className="text-black dark:text-white">{user.favoriteIdol ? user.favoriteIdol.replace(/[0-9]/g, '') : "None"}</p>
                                        </div>
                                        <div className={`flex ${favoriteImageUrl ? "flex-col" : "flex-row justify-between"}`}>
                                            <div className={`flex flex-row justify-between ${favoriteImageUrl ? "w-full" : ""}`}>
                                                <p className="text-[#6c6c6c] dark:text-[#b8b8b8]">Favorite Image:&nbsp;</p>
                                                <p className="text-[#6c6c6c] dark:text-[#b8b8b8]">({favoriteImageVotes} Like{favoriteImageVotes !== 1 ? "s" : ""})</p>
                                            </div>
                                            {favoriteImageUrl ? (
                                                <ImageWithPlaceholder
                                                    className="w-48 h-auto rounded-xl box-border border-2 border-black dark:border-gray-500"
                                                    src={favoriteImageUrl}
                                                    alt="Favorite image"
                                                    width={favoriteImageWidth}
                                                    height={favoriteImageHeight}
                                                />
                                            ) : (
                                                <p className="text-black dark:text-white">None</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
        
    );
};

export default Leaderboard;
