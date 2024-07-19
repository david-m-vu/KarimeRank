import './App.css';
import Main from "./scenes/Main/Main.js"
import Rankings from "./scenes/Rankings/Rankings.js"
import Navbar from "./components/Navbar/Navbar.js"
import { useState, useEffect } from "react"

import { Routes, Route } from "react-router-dom";

const App = () => {
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <div className="App">
      <Navbar totalVotes={totalVotes} />
      <Routes>
        <Route path="/" element={<Main />}></Route>
        <Route path="/rankings" element={<Rankings setTotalVotes={setTotalVotes} />}></Route>
      </Routes>
    </div>
  );
}

export default App;
