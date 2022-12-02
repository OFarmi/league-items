import React, { useState, useEffect, KeyboardEvent } from 'react'
import axios from "axios";
import "./ChampionsSearchbar.css";

export default function ChampionsSearchbar(props: { search: (champion: string) => void, version: string }) {
    const [prefix, setPrefix] = useState("")
    const [currentSuggestion, setCurrentSuggestion] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [champions, setChampions] = useState<string[]>([])
    const lowercaseChampions = champions.map(champion => champion.toLowerCase())


    const findSuggestions = (input: string) => {
        if (input) {
            const results = champions.filter(champion => champion.toLowerCase().startsWith(input.toLowerCase()))
            setSuggestions(results)
        } else {
            setSuggestions([])
        }
    }

    const onChange = (e: { target: HTMLInputElement }) => {
        const userInput = e.target.value
        setPrefix(userInput)
        findSuggestions(userInput)
    }

    const confirmSearch = () => {
        const searched = currentSuggestion.toLowerCase() || prefix.toLowerCase()
        const index = lowercaseChampions.indexOf(searched)
        if (index >= 0) {
            props.search(champions[index])
            setSuggestions([])
            setPrefix("")
            setCurrentSuggestion("")
        }
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            confirmSearch()
        }
        else if (e.key === "ArrowDown") {
            const searched = currentSuggestion.toLowerCase() || prefix.toLowerCase()
            const index = suggestions.map(suggestion => suggestion.toLowerCase()).indexOf(searched)
            if (index === suggestions.length - 1 && suggestions.length > 0) {
                setCurrentSuggestion("")
            } else if (suggestions.length > 0) {
                setCurrentSuggestion(suggestions[index + 1])
            }
        } else if (e.key === "ArrowUp") {
            const searched = currentSuggestion.toLowerCase() || prefix.toLowerCase()
            const index = suggestions.map(suggestion => suggestion.toLowerCase()).indexOf(searched)
            if (index === 0) {
                setCurrentSuggestion("")
            } else if (index === -1 && suggestions.length > 0) {
                setCurrentSuggestion(suggestions[suggestions.length - 1])
            } else if (suggestions.length > 0) {
                setCurrentSuggestion(suggestions[index - 1])
            }
        }
    }

    useEffect(() => {
        //gets called if there's a new props.version, but there's no guarantee that version has a new champion
        axios.get(`/champions`)
            .then((res) => {
                setChampions(res.data)
            })
    }, [props.version])

    return (
        <div className="search-container">
            <div className="search-bar-container">
                <input
                    className="search-bar"
                    type="text"
                    name="search-bar"
                    id="search-bar"
                    maxLength={22}
                    placeholder="Search a champion..."
                    value={currentSuggestion || prefix}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onBlur={() => setSuggestions([])}
                    onFocus={() => findSuggestions(prefix)}
                />
                <img
                    alt="search icon"
                    onClick={confirmSearch}
                    className="search-icon"
                    src="/search-icon-png-21.png"
                />
            </div>
            <div className="suggestions-container">
                {
                    suggestions.map((suggestion) => (
                        <div
                            className="suggestion"
                            key={suggestion}
                            onMouseDown={(event) => {
                                // onMouseDown isn't entirely correct, doesnt allow saving misclicks
                                // onClick doesn't work here because search-bar's onBlur takes priority and sets suggestions to empty when trying to click
                                props.search(suggestion)
                                setPrefix("")
                                setSuggestions([])
                                setCurrentSuggestion("")
                            }}>
                            <img
                                alt="champion search result"
                                className="suggestion-img"
                                src={`http://ddragon.leagueoflegends.com/cdn/${props.version}/img/champion/${suggestion}.png`}>
                            </img>
                            <p className="suggestion-text">
                                {suggestion}
                            </p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}