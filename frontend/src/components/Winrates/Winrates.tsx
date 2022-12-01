import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Winrates.css"
import Item from "../Item/Item";

//centralized place for types between frontend and backend?

export type ItemData = {
    item_id: string,
    item_name: string,
    winrate: number
}


export default function Winrates(props: { champion: string, version: string }) {
    const [items, setItems] = useState<ItemData[]>([]);
    const [itemData, setItemData] = useState<any>()

    //gets the description and gold cost of all items from riot API
    useEffect(() => {
        // gets called if there's a new version, but there's no guarantee that there's a new item on this patch
        axios.get(`http://localhost:8081/items`)
            .then((data) => {
                setItemData(data.data)
            })
    }, [props.version])

    //returns the item statistics stored in DB
    useEffect(() => {
        if (props.champion) {
            axios.get(`http://localhost:8081/champions/${props.champion}`)
                .then((itemStats) => {
                    setItems(itemStats.data)
                })
        }
    }, [props]);

    return (
        <div className="winrate-container">
            {
                props.champion &&
                <img
                    alt="champion"
                    className="champ-image"
                    src={`http://ddragon.leagueoflegends.com/cdn/${props.version}/img/champion/${props.champion}.png`} />
            }
            {
                <div className="items-container">
                    {items.length ? items.map((item) => (
                        <React.Fragment key={item.item_id}>
                            <Item
                                itemData={item}
                                description={itemData[item.item_id].description}
                                gold={itemData[item.item_id].gold.total}
                                version={props.version} />
                        </React.Fragment>
                    )) : props.champion ? "No recorded games" : "Select a Champion"}
                </div>
            }
        </div>
    )

}