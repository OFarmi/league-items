import React from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";

function App() {
  const [data, setData] = React.useState<any[]>([]);
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

  React.useEffect(() => {
    if (champion) {
    axios.get(`http://localhost:8081/${champion}`)
      .then((res) => {
        setData(res.data)
      })
  }}, [champion]);

  return (
    <div className="App">
      <header className="App-header">
      <img className="champ-image" src={champion ? `http://ddragon.leagueoflegends.com/cdn/12.21.1/img/champion/${champion}.png` : ''}/>
        { data.length ? <span className="container" >{data.map((d) => (
          <div className="items-container" key={d.item_id}>
            <div className="item-image"><img key={d.item_name} src={`http://ddragon.leagueoflegends.com/cdn/12.21.1/img/item/${d.item_id}.png`} /></div>
            <div className="item-name"><h3 key = {d.item_id}>{d.winrate}%{"\n"}</h3></div>
          </div>
        ))}</span> : champion ? "No games recorded" : "Select Champion"}
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