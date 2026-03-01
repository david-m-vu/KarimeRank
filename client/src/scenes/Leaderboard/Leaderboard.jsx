import "./Leaderboard.css";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ImageWithPlaceholder from "../../components/ImageWithPlaceHolder/ImageWithPlaceholder.jsx";

const topRowGradients = [
    ["#F7D46B", "#D89A2B"], // Gold
    ["#F1F1F1", "#BFC3C8"], // Silver
    ["#E0B07A", "#B87333"], // Bronze
];

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [hoveredUserId, setHoveredUserId] = useState(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [popupSize, setPopupSize] = useState({ width: 0, height: 0 });
    
    const hasLoadedOnceRef = useRef(false);
    const popupRef = useRef(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const leaderboardMetric = searchParams.get("metric") === "allTime" ? "allTime" : "month";
   
    // if leaderboardMetric changes, refetch leaderboard based on query parameter
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setError(null);
                if (!hasLoadedOnceRef.current) {
                    setIsInitialLoading(true);
                } else {
                    setIsRefreshing(true);
                }

                const metricParam = leaderboardMetric === "allTime" ? "?metric=totalVotesAllTime" : "";
                const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/users/leaderboard${metricParam}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch leaderboard");
                }
                const data = await res.json();
                setUsers(data.leaderboard);
                hasLoadedOnceRef.current = true;
            } catch (err) {
                setError(err.message);
            } finally {
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        };

        fetchLeaderboard();
    }, [leaderboardMetric]);

    // measure the dimensions of the popup
    useEffect(() => {
        if (!hoveredUserId || !popupRef.current) {
            return;
        }

        const measurePopup = () => {
            if (!popupRef.current) {
                return;
            }
            const rect = popupRef.current.getBoundingClientRect();
            setPopupSize({ width: rect.width, height: rect.height });
        };

        measurePopup();
        window.addEventListener("resize", measurePopup);
        return () => window.removeEventListener("resize", measurePopup);
    }, [hoveredUserId, leaderboardMetric, users]);

    if (isInitialLoading) {
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
        // clientX provdes the horizontal coordinate iwthin the application's viewport at which the event occured
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleMetricChange = (nextMetric) => {
        if (nextMetric === leaderboardMetric || isRefreshing) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        if (nextMetric === "allTime") {
            nextParams.set("metric", "allTime");
        } else {
            nextParams.delete("metric");
        }

        setSearchParams(nextParams);
    };

    const getPopupStyle = () => {
        const offset = 16;
        const margin = 12;
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
        const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

        // calculate by default where the popup will begin
        let nextLeft = cursorPos.x + offset;
        let nextTop = cursorPos.y + offset;

        // if the popup spans past the width of the screen, move popup to the left instead of the right
        if (popupSize.width > 0 && nextLeft + popupSize.width + margin > viewportWidth) {
            nextLeft = cursorPos.x - popupSize.width - offset;
        }

        // if the popup spans past the height of the screen, move popup to flip upwards instead of growing downwards
        if (popupSize.height > 0 && nextTop + popupSize.height + margin > viewportHeight) {
            nextTop = cursorPos.y - popupSize.height - offset;
        }

        // maxLeft represents the total leftover space in the inner viewport
        // it is the furthest right left position the popup is allowed to have while still staying on screen
            // in other words, if left > maxLeft, the popup would overflow off the right side
        const maxLeft = Math.max(margin, viewportWidth - popupSize.width - margin);
        const maxTop = Math.max(margin, viewportHeight - popupSize.height - margin);

        const clampedLeft = Math.min(Math.max(nextLeft, margin), maxLeft);
        const clampedTop = Math.min(Math.max(nextTop, margin), maxTop);

        return {
            top: clampedTop,
            left: clampedLeft,
            maxHeight: "calc(100vh - 24px)",
            overflowY: "auto",
        };
    };
    
    return (
        <div id="leaderboard" className="flex flex-1 justify-center items-start pt-12">
            <div className="flex flex-col gap-4 w-full max-w-md px-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl text-black dark:text-white text-center">Top Voters</h1>
                <div className="flex items-center justify-center">
                    <div className="inline-flex rounded-full border border-black/20 dark:border-white/30 p-1 bg-[#F0F0D8] dark:bg-[#3F3F3F]">
                        <button
                            type="button"
                            onClick={() => handleMetricChange("month")}
                            disabled={isRefreshing}
                            className={`px-4 py-1.5 rounded-full text-sm ${leaderboardMetric === "month" ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/70 dark:text-white/80"}`}
                        >
                            This Month
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMetricChange("allTime")}
                            disabled={isRefreshing}
                            className={`px-4 py-1.5 rounded-full text-sm ${leaderboardMetric === "allTime" ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/70 dark:text-white/80"}`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                <div
                    aria-busy={isRefreshing}
                    className={`flex flex-col gap-2 transition-opacity duration-200 ${isRefreshing ? "opacity-70" : "opacity-100"}`}
                >
                    {users.map((user, index) => {
                        const topRowGradient = topRowGradients[index] || null; // only nonnull for the first 3 rows
                        const isTopRow = Boolean(topRowGradient);
                        const primaryTextClass = isTopRow ? "text-[#1F1F1F]" : "text-black dark:text-white";
                        const secondaryTextClass = isTopRow ? "text-[#4F4F4F]" : "text-[#6c6c6c] dark:text-[#b8b8b8]";
                        const selectedVotes = leaderboardMetric === "allTime" ? (user.totalVotesAllTime || user.totalVotes || 0) : (user.totalVotes || 0);
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
                                    <span className={`tabular-nums ${primaryTextClass}`}>{selectedVotes} vote{selectedVotes !== 1 && "s"}</span>
                                </div>

                                {/* cursor-following popup */}
                                {hoveredUserId === user.id && (
                                    <div
                                        ref={popupRef}
                                        className="leaderboard-popup fixed z-50 flex flex-col p-4 min-w-[14rem] gap-3 rounded-lg bg-[#F8F8D6]/[0.97] dark:bg-[#4C4C4C]/[0.97] shadow-2xl pointer-events-none"
                                        style={getPopupStyle()}
                                    >
                                        <div className="flex flex-col">
                                            <p className="text-base leading-tight text-black dark:text-white">{user.nickname}</p>
                                            <p className="text-xs leading-tight text-[#6c6c6c] dark:text-[#b8b8b8]">@{user.username}</p>
                                        </div>

                                        <hr className="border-0 border-t border-black dark:border-white" />

                                        <div className="flex flex-col text-sm leading-6">

                                            <p className="text-xs md:text-sm lg:text-base leading-tight">All time stats</p>
                                            <div className="flex flex-row justify-between">
                                                <p className="text-[#6c6c6c] dark:text-[#b8b8b8]"># Votes:</p>
                                                <p className="tabular-nums">{user.totalVotesAllTime || user.totalVotes}</p>
                                            </div>  
                                            
                                            <hr className="my-2 border-0 border-t border-black/30 dark:border-white/30"/>

                                            <p className="text-xs md:text-sm lg:text-base leading-tight">This Month's Stats</p>
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
                    {isRefreshing && (
                        <p className="text-center text-xs text-[#6c6c6c] dark:text-[#b8b8b8]">Updating leaderboard...</p>
                    )}
                </div>
            </div>
        </div>
        
    );
};

export default Leaderboard;
