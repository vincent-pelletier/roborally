import wallImg from '../assets/Wall.png';
import './wall.css';

const Wall = ({wall, positionX, positionY}) => {

    return (
        <img src={wallImg} alt="wall" className={'wall direction' + wall.direction} style={{top: (positionY[wall.y] - positionY[0]) + "px", left: (positionX[wall.x] - positionX[0] + (wall.x > 3 ? 1 : 0)) + "px"}} draggable="false"/>
    );
};

export default Wall;