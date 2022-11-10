import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Winrates({props}: { props: string}) {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (props) {
        axios.get(`http://localhost:8081/${props}`)
          .then((res) => {
            setItems(res.data)
          })
    }}, [props]);

    return (
        <div>
            <img className="champ-image" src={props ? `http://ddragon.leagueoflegends.com/cdn/12.21.1/img/champion/${props}.png` : ''}/>
            { items.length ? 
            <span className="container" >
                {items.map((item) => (
                    <div className="items-container" key={item.item_id}>
                        <div className="item-image">
                            <img key={item.item_name} src={`http://ddragon.leagueoflegends.com/cdn/12.21.1/img/item/${item.item_id}.png`} />
                        </div>
                        <div className="item-name">
                            <h3 key = {item.item_id}>
                                {item.winrate}%{"\n"}
                            </h3>
                        </div>
                    </div>
                ))}
            </span> : props ? "No games recorded" : "Select Champion"}
        </div>
    )
    
}