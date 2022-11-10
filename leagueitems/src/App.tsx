import React from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import Winrates from "./components/Winrates/Winrates";
import ChampionsSearchbar from "./components/ChampionsSearchbar/ChampionsSearchbar";

function App() {
  const [open, setOpen] = React.useState(false);
  const [champions, setChampions] = React.useState<string[]>([])
  const [champion, setChampion] = React.useState<string>('')
  const handleOpen = () => {
    setOpen(!open);
  };


  React.useEffect(() => {
    axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((res) => {
        axios.get(`https://ddragon.leagueoflegends.com/cdn/${res.data[0]}/data/en_US/champion.json`)
          .then((res) => {
            setChampions(Object.getOwnPropertyNames(res.data.data))
          })
      })
  }, [champions])
/*
  React.useEffect(() => {
    if (champion) {
    axios.get(`http://localhost:8081/${champion}`)
      .then((res) => {
        setItems(res.data)
      })
  }}, [champion]);*/

  return (
    <div className="App">
      <header className="App-header">
      <Winrates props={champion}/>
      <ChampionsSearchbar onEvent={}/>
        <button onClick={handleOpen}>Champions</button>
        {open ? (
          <li className="menu-item">
            {champions.map((champ) => (
              <button key = {champ} onClick={() => setChampion(champ)}>{champ}</button>
            ))}
          </li>
      ) : null}
      </header>
    </div>
  );
}

export default App;