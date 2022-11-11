import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import Winrates from "./components/Winrates/Winrates";
import ChampionsSearchbar from "./components/ChampionsSearchbar/ChampionsSearchbar";

function App() {
  const [champion, setChampion] = useState<string>('')


  return (
    <div className="App">
      <header className="App-header">
        <Winrates champion={champion} />
        <ChampionsSearchbar search={setChampion} />
      </header>
    </div>
  );
}

export default App;