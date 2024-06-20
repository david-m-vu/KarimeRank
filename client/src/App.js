import './App.css';
import Main from "./scenes/Main/Main.js"
import Navbar from "./components/Navbar/Navbar.js"

import { Routes, Route } from "react-router-dom";
function App() {
  return (
    <div className="App">
      <Navbar/>
      <Routes>
        <Route path="/" element={<Main/>}></Route>
      </Routes>
    </div>
  );
}

export default App;
