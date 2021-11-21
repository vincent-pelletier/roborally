import './card.css';
// prop types

const Card = ({card}) => {

    return (
        <div className={"card " + card.type}>
            <span>{card.type}</span>
            <span>({card.id})</span>
        </div>
    );
};

//Card.proptypes={type: proptype.string, key: proptype.int}
export default Card;