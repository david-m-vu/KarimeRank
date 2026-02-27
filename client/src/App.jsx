import './App.css';
import { useState, useEffect, useRef } from "react"
import { Routes, Route } from "react-router-dom";

import { db } from "./firebase/firebaseConfig.js";
import { doc, onSnapshot } from "firebase/firestore";

import Main from "./scenes/Main/Main.jsx"
import Rankings from "./scenes/Rankings/Rankings.jsx"
import Navbar from "./components/Navbar/Navbar.jsx"

import Login from './scenes/Login/Login.jsx';
import Register from './scenes/Register/Register.jsx';
import ChangeNickname from './scenes/ChangeNickname/ChangeNickname.jsx';
import Leaderboard from "./scenes/Leaderboard/Leaderboard.jsx";
import RequireAuth from './components/RequireAuth/RequireAuth.jsx';

const numPopAnimationOn = false;

const App = () => {
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalVotesAnimationKey, setTotalVotesAnimationKey] = useState(0);
  const previousTotalVotesRef = useRef(null); // ref so updates don't trigger rerenders

  useEffect(() => {
    const ref = doc(db, process.env.REACT_APP_TEST_MODE === "TEST_MODE" ? "test_stats" : "stats", "globalVotes");
    // Attaches a listener for DocumentSnapshot events
    const unsub = onSnapshot(ref, (snap) => {
      const nextTotalVotes = Number(snap.data()?.totalVotes ?? 0);
      
      if (numPopAnimationOn) {
        const previousTotalVotes = previousTotalVotesRef.current;

        if (previousTotalVotes !== null && previousTotalVotes !== nextTotalVotes) {
          setTotalVotesAnimationKey((prev) => prev + 1);
        }

        previousTotalVotesRef.current = nextTotalVotes;
      }

      setTotalVotes(nextTotalVotes);
    })
    return unsub;
  }, [])

  return (
    <div className="App min-h-dvh flex flex-col">
      <Navbar totalVotes={totalVotes} totalVotesAnimationKey={totalVotesAnimationKey} numPopAnimationOn={numPopAnimationOn}/>
      <main className="flex-1 min-h-0 flex">
        <Routes>
          <Route path="/" element={<Main />}></Route>
          <Route path="/rankings" element={<Rankings />}></Route>
          <Route path="/leaderboard" element={<Leaderboard/>}></Route>
          <Route path="/register" element={<Register/>}></Route>
          <Route path="/login" element={<Login/>}></Route>
          <Route
            path="/onboarding/nickname"
            element={
              <RequireAuth>
                <ChangeNickname />
              </RequireAuth>
            }
          ></Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
