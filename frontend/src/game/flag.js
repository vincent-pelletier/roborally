import './flag.css';

const Flag = ({flag, positionX, positionY}) => {

    return (
        <img src={flag.src} alt={flag.id} className="checkpoint" style={{top: (positionY[flag.y] - positionY[0]) + "px", left: (positionX[flag.x] - positionX[0] + 1) + "px"}} draggable="false"/>
    );
};

export default Flag;