import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Winrates.css"
import Item from "../Item/Item";

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
        if (props.version) {
            axios.get(`https://ddragon.leagueoflegends.com/cdn/${props.version}/data/en_US/item.json`, {
            })
                .then((res) => {
                    setItemData(res.data)
                })
        }
    }, [props.version])

    //returns the item statistics stored in DB
    useEffect(() => {
        if (props.champion) {
            axios.get(`http://localhost:8081/${props.champion}`,)
                .then((res) => {
                    setItems(res.data)
                })
        }
    }, [props]);

    return (
        <div className="winrate-container">
            {
                props.champion &&
                <img
                    className="champ-image"
                    src={`http://ddragon.leagueoflegends.com/cdn/${props.version}/img/champion/${props.champion}.png`} />
            }
            {
                <div className="items-container">
                    {items.length ? items.map((item) => (
                        <React.Fragment key={item.item_id}>
                            <Item
                                itemData={item}
                                description={itemData.data[item.item_id].description}
                                gold={itemData.data[item.item_id].gold.total}
                                version={props.version} />
                        </React.Fragment>
                    )) : props.champion ? "No recorded games" : "Select a Champion"}
                </div>
            }
        </div>
    )

}