import useSound from 'use-sound'; // https://www.joshwcomeau.com/react/announcing-use-sound-react-hook/
import audioJoin from '../assets/audio/join.mp3';
import audioLeave from '../assets/audio/leave.mp3';

const useSoundLibrary = () => {
    const [playAudioJoin] = useSound(audioJoin); // lower volume, other options...
    const [playAudioLeave] = useSound(audioLeave);

    return {playAudioJoin, playAudioLeave};
};

export default useSoundLibrary;
