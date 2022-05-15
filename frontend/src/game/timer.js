import React, { useEffect, useState } from 'react';
import './timer.css';

const Timer = ({initialSeconds, onTimerEnd}) => {
    const [seconds, setSeconds] =  useState(-1);

    useEffect(() => {
        setSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        let myInterval = setInterval(() => {
            if (seconds >= 0) {
                setSeconds(seconds - 1);
            }
            if (seconds === 0) {
                onTimerEnd();
            } else if (seconds === -1) {
                clearInterval(myInterval);
            }
        }, 1000); // slows down if window is minimized...?

        return () => clearInterval(myInterval);
    }, [seconds, onTimerEnd]);

    return (
        <div className="timer">
            {seconds < 0 ? null : (Math.floor(seconds / 60)) + ':' + ((seconds % 60) < 10 ? '0' : '') + (seconds % 60)}
        </div>
    )
}

export default Timer;