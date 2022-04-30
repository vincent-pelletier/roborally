import './card.css';
// prop types

const Card = ({card, selected, inRegister, isLocked, clicked, visible}) => {

    return (
        <div className={
            "card" +
            (card.type ? " " + card.type : "") +
            (card.id < 0 ? " empty" : "") + (isLocked(card.id) ? " locked" : "") +
            (selected > 0 ? (card.id > 0 ? (selected === card.id ? " src" : (inRegister(card.id) ? " dest" : "")) : (inRegister(card.id) ? " dest" : "")) : "") +
            (!visible ? " flipped" : "")
            }
            onClick={(e) => clicked(card.id, e)}>
            <span>{card.type}</span>
        </div>
    );
};

//Card.proptypes={type: proptype.string, key: proptype.int}
export default Card;