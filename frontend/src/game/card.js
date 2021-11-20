import { Component } from "react";

class Card extends Component {
    constructor(props) {
        super(props)
        this.type = props.type;
        this.key = props.key;
    }

    render() {
        return (
            <div className={"card " + this.type} key={this.key}>
                <span>{this.type}</span>
                <span>({this.key})</span>
            </div>
        );
    }
}

export default Card;