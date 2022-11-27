import { ItemData } from "../Winrates/Winrates";
import React from "react"
import "./Item.css"

/**
 * Removes the <> tags within a description
 * @param description 
 * @returns the description with removed tags
 */
const removeSymbols = (description: string): string => {
    while (description.includes("<") || description.includes(">")) {
        description = description.replace(description.substring(description.indexOf("<"), description.indexOf(">") + 1), "")
    }
    return description
}

/**
 * Formats an item description to have stats and passive, active, and mythic passive descriptions separated to be properly rendered
 * @param description 
 * @returns an array with each element being stats, a passive, active, or mythic passive
 */
const parseDescription = (description: string) => {
    const result = []
    let stats = description.substring(description.indexOf("<stats>") + 7, description.indexOf("</stats>"))
    stats = stats.replaceAll("<br>", "\n")
    description.replace(stats, "")
    result.push(removeSymbols(stats) + "\n")
    const activeIndex = description.indexOf("</active>")
    if (activeIndex > -1) {
        let active = description.substring(description.indexOf("<active>", activeIndex) + 8, description.indexOf("</active>", activeIndex + 1)) + description.substring(description.indexOf("</active>", activeIndex + 1), description.indexOf("</active>", activeIndex + 1)) +
            description.substring(description.indexOf("</active>", activeIndex + 1) + 9, description.indexOf(".<", activeIndex) + 1)

        result.push("\n Active: " + removeSymbols(active) + "\n")
    }
    let passiveIndex = description.indexOf("<passive>")
    while (passiveIndex > -1) {
        let passive = description.substring(passiveIndex + 9, description.indexOf("</passive>", passiveIndex)) + description.substring(description.indexOf("</passive>", passiveIndex) + 10,
            description.indexOf("<li>", passiveIndex) > 0 ? description.indexOf("<li>", passiveIndex) : description.indexOf(".", passiveIndex))
        result.push("\n ◉ " + removeSymbols(passive))
        passiveIndex = description.indexOf("<passive>", description.indexOf("<li>", passiveIndex) > 0 ? description.indexOf("<li>", passiveIndex) : description.indexOf(".", passiveIndex))
    }
    const mythicIndex = description.indexOf("<rarityMythic>")
    if (mythicIndex > -1) {
        let mythic = description.substring(mythicIndex + 14, description.indexOf("</rarityMythic>")) + description.substring(description.indexOf("</rarityMythic>", mythicIndex + 1) + 15, description.indexOf("</mainText>", mythicIndex + 1))
        result.push("\n" + removeSymbols(mythic))
    }
    return result
    // could make this return a component instead of a list, but looks good as is
}

export default function Item(props: { itemData: ItemData, description: string, gold: string, version: string }) {

    return (
        <div className="item-container" key={props.itemData.item_id}>
            <div className="item-image">
                <img className="image" key={props.itemData.item_name} src={`http://ddragon.leagueoflegends.com/cdn/${props.version}/img/item/${props.itemData.item_id}.png`} />
            </div>
            <div className="description">
                <h4>{props.itemData.item_name}</h4>
                {parseDescription(props.description)}
            </div>
            <div className="gold" key={props.itemData.item_id}>{props.gold}g</div>
            <div className="item-winrate">
                <h3 key={props.itemData.item_id}>
                    {props.itemData.winrate}%{"\n"}
                </h3>
            </div>

        </div>
    )
}