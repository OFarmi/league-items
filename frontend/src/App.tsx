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
      axios.get('/version')
        .then((versions: any) => {
          const latestVersion = versions.data
          if (!currentVersion) {
            setCurrentVersion(latestVersion)
          }
          else if (currentVersion !== latestVersion) {
            setCurrentVersion(latestVersion)
            axios.patch('/version', {
              version: latestVersion
            })
          }
          //console.log(latestVersion)
        })
    }

    // checks for a new update every 12 hours
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