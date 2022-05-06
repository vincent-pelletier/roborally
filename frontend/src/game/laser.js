import laserX from '../assets/LaserX.png';
import laserY from '../assets/LaserY.png';
import './laser.css';

const Laser = ({laser, positionX, positionY}) => {

    return (
        <img src={laser.direction % 180 === 0 ? laserY : laserX} alt="laser" draggable="false"
            className={'laser direction' + (laser.direction % 270 === 0 ? 180 : 0) + (laser.active ? ' active' : '')}
            style={{
                top: (laser.direction === 0 ? positionY[laser.y] - 910 : positionY[laser.y]) + "px",
                left: (laser.direction === 270 ? positionX[laser.x] - 910 : positionX[laser.x]) + "px",
                clipPath: "inset(0px " + (laser.direction % 180 === 0 ?
                    ("0px " + (positionX[positionX.length - laser.length - (laser.direction === 0 ? 1 : 0)] - (laser.direction === 0 ? positionY[0] : positionX[0]) + laser.targetPx) + "px") :
                    ((positionX[positionX.length - laser.length - (laser.direction === 270 ? 1 : 0)] - positionX[0] + laser.targetPx) + "px 0px")
                ) + " 0px)"
            }}/>
    );
};

export default Laser;