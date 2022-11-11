import React, { useState, useEffect, KeyboardEvent } from 'react'
import axios from "axios";
import "./ChampionsSearchbar.css";

export default function ChampionsSearchbar(props: { search: (champion: string) => void }) {
    const [prefix, setPrefix] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [champions, setChampions] = React.useState<string[]>([])
    const lowercaseChampions = champions.map(champion => champion.toLowerCase())

    const onChange = (e: { target: HTMLInputElement }) => {
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
            //const searched = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()
            const searched = prefix.toLowerCase()
            const index = lowercaseChampions.indexOf(searched)
            if (index >= 0) {
                props.search(champions[index])
                setSuggestions([])
                setPrefix('')
            }
        }
        else if (e.key == "ArrowDown") {
            //error with multiword, TahmKench
            //const searched = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()
            const searched = prefix.toLowerCase()
            const index = suggestions.map(suggestion => suggestion.toLowerCase()).indexOf(searched)
            if (index >= 0 && index < suggestions.length - 1) {
                setPrefix(suggestions[index + 1])
            } else if (suggestions.length > 0) {
                setPrefix(suggestions[0])
            }
        } else if (e.key == "ArrowUp") {
            const searched = prefix.toLowerCase()
            const index = suggestions.map(suggestion => suggestion.toLowerCase()).indexOf(searched)
            if (index > 0 && suggestions.length > 0) {
                setPrefix(suggestions[index - 1])
            } else if (suggestions.length > 0) {
                setPrefix(suggestions[suggestions.length-1])
            }
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
        <div className="search-bar-container">
            <input
                className="search-bar"
                type="text"
                name="search-bar"
                id="search-bar"
                placeholder="Search a champion..."
                value={prefix}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
            <div className="suggestions-container">
                {
                    suggestions.map((suggestion) => (
                        <div className="suggestions" key={suggestion}>
                            <p className="suggestion" onClick={() => {
                                props.search(suggestion)
                                setPrefix("")
                                setSuggestions([])
                            }}>
                                {suggestion}
                            </p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}