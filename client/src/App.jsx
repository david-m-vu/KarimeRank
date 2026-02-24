import './App.css';
import Main from "./scenes/Main/Main.jsx"
import Rankings from "./scenes/Rankings/Rankings.jsx"
import Navbar from "./components/Navbar/Navbar.jsx"
import { useState } from "react"

import { Routes, Route } from "react-router-dom";
import Login from './scenes/Login/Login.jsx';
import Register from './scenes/Register/Register.jsx';
import ChangeNickname from './scenes/ChangeNickname/ChangeNickname.jsx';
import RequireAuth from './components/RequireAuth/RequireAuth.jsx';

const App = () => {
  const [totalVotes, setTotalVotes] = useState(0);

  return (
    <div className="App min-h-dvh flex flex-col">
      <Navbar totalVotes={totalVotes} />
      <main className="flex-1 min-h-0 flex">
        <Routes>
          <Route path="/" element={<Main />}></Route>
          <Route path="/rankings" element={<Rankings setTotalVotes={setTotalVotes} />}></Route>
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
