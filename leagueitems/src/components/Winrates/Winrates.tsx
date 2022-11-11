import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Winrates.css"

export default function Winrates(props: { champion: string }) {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (props.champion) {
            axios.get(`http://localhost:8081/${props.champion}`)
                .then((res) => {
                    setItems(res.data)
                })
        }
    }, [props]);

    return (
        <div className="winrate-container">
            <img className="champ-image" src={props.champion ? `http://ddragon.leagueoflegends.com/cdn/12.21.1/img/champion/${props.champion}.png` : ''} />
            {
                <div className="items-container">
                    {items.length ? items.map((item) => (
                        <div className="item-container" key={item.item_id}>
                            <div className="item-image">
                                <img key={item.item_name} src={`http://ddragon.leagueoflegends.com/cdn/12.21.1/img/item/${item.item_id}.png`} />
                            </div>
                            <div className="item-winrate">
                                <h3 key={item.item_id}>
                                    {item.winrate}%{"\n"}
                                </h3>
                            </div>
                        </div>
                    )) : props.champion ? "No recorded games" : "Select Champion"}
                </div>}
        </div>
    )

}