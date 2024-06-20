import './App.css';
import Main from "./scenes/Main/Main.js"
import Rankings from "./scenes/Rankings/Rankings.js"
import Navbar from "./components/Navbar/Navbar.js"

import { Routes, Route } from "react-router-dom";
function App() {
  return (
    <div className="App">
      <Navbar/>
      <Routes>
        <Route path="/" element={<Main/>}></Route>
        <Route path="/rankings" element={<Rankings/>}></Route>
      </Routes>
    </div>
  );
}

export default App;
