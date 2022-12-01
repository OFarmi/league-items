import React, { useState, useEffect } from "react";
import "./App.css";
import Winrates from "./components/Winrates/Winrates";
import ChampionsSearchbar from "./components/ChampionsSearchbar/ChampionsSearchbar";
import axios from "axios";


export default function App() {
  const [champion, setChampion] = useState<string>('')
  const [currentVersion, setCurrentVersion] = useState<string>('')

  useEffect(() => {
    const updateVersion = async () => {
      axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
        .then((versions: any) => {
          const latestVersion = versions.data[0]
          if (!currentVersion) {
            setCurrentVersion(latestVersion)
          }
          else if (currentVersion !== latestVersion) {
            setCurrentVersion(latestVersion)
            axios.patch('http://localhost:8081/version', {
              version: latestVersion
            })
          }
          console.log(latestVersion)
        })
    }

    updateVersion()
    const interval = setInterval(updateVersion, 1000 * 60 * 60 * 12)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <Winrates
          champion={champion}
          version={currentVersion} />
        <ChampionsSearchbar
          search={setChampion}
          version={currentVersion} />
      </header>
    </div>
  );
}

//export default App;