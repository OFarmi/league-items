import React, { useState, useEffect, KeyboardEvent } from 'react'
import axios from "axios";

export default function ChampionsSearchbar() {
    const [prefix, setPrefix] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [champions, setChampions] = React.useState<string[]>([])


    const onChange = (e: {target: HTMLInputElement}) => {
        const userInput = e.target.value
        setPrefix(userInput)
        if (userInput) {
            const results = champions.filter(champion => champion.toLowerCase().startsWith(userInput.toLowerCase()))
            setSuggestions(results)
        } else {
            setSuggestions([])
        }
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key == "Enter") {
            console.log(e.key)
        }
    }

    useEffect(() => {
        axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
          .then((res) => {
            axios.get(`https://ddragon.leagueoflegends.com/cdn/${res.data[0]}/data/en_US/champion.json`)
              .then((res) => {
                setChampions(Object.getOwnPropertyNames(res.data.data))
              })
          })
    }, [champions])
    
    return (
        <div>
            <input
                className="search-bar"
                type="text"
                name="search-bar"
                id="search-bar"
                placeholder="Search..."
                value={prefix}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
            {
                suggestions.map((suggestion) => (
                    <div key={suggestion}>
                        <p>{suggestion}</p>
                    </div>
                ))
            }
        </div>
    )
}