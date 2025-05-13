import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RNMediapipe } from '@thinksys/react-native-mediapipe';

type Screen = 'intro' | 'menu' | 'calibration' | 'countdown' | 'session' | 'done';
type Exercise = 'highKnees' | 'squats' | 'lunges' | 'calfRaises' | 'oneLegSquat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [countdown, setCountdown] = useState<number | string>(3);
  const [exercise, setExercise] = useState<Exercise>('highKnees');
  const [repCount, setRepCount] = useState(0);
  const [sessionKey, setSessionKey] = useState(Date.now());
  const [poseCorrect, setPoseCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [calibrated, setCalibrated] = useState(false);
  const [state, setState] = useState({
    leftUp: false,
    rightUp: false,
    isSquatting: false,
    isLunging: false,
    isRaising: false,
    isOneLegSquatting: false,
  });

  const resetSession = () => {
    setRepCount(0);
    setPoseCorrect(false);
    setLandmarks([]);
    setCalibrated(false);
    setState({
      leftUp: false,
      rightUp: false,
      isSquatting: false,
      isLunging: false,
      isRaising: false,
      isOneLegSquatting: false,
    });
  };

  useEffect(() => {
    if (repCount >= 10) {
      setTimeout(() => {
        setScreen('done');
      }, 800);
    }
  }, [repCount]);

  const startExercise = (ex: Exercise) => {
    setExercise(ex);
    resetSession();
    setScreen('calibration');
  };

  const flashPose = () => {
    setPoseCorrect(true);
    setTimeout(() => setPoseCorrect(false), 800);
  };
  const exerciseLabels: Record<Exercise, string> = {
    highKnees: 'High Knees',
    squats: 'Squats',
    lunges: 'Lunges',
    calfRaises: 'Calf Raises',
    oneLegSquat: 'One Leg Squat',
  };

  const handleLandmarks = (data: any) => {
    const lm = data.landmarks;
    if (!lm || lm.length < 30) return;
    setLandmarks(lm);

    const lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26], la = lm[27], ra = lm[28], ls = lm[11], rs = lm[12];

    if (screen === 'calibration') {
      const inBox =
        ls.y > 0.2 && ls.y < 0.6 &&
        rs.y > 0.2 && rs.y < 0.6 &&
        la.y > 0.5 && la.y < 0.9 &&
        ra.y > 0.5 && ra.y < 0.9;

      if (inBox && !calibrated) {
        setCalibrated(true);
        setCountdown(3);
        setScreen('countdown');
        let seconds = 3;
        const countdownInterval = setInterval(() => {
          seconds -= 1;
          if (seconds > 0) {
            setCountdown(seconds);
          } else {
            clearInterval(countdownInterval);
            setCountdown('Go!');
            setTimeout(() => {
              resetSession();
              setScreen('session');
            }, 800);
          }
        }, 1000);
      }
      return;
    }

    if (screen !== 'session') return;

    const { leftUp, rightUp, isSquatting, isLunging, isRaising, isOneLegSquatting } = state;

    if (exercise === 'highKnees') {
      if (lk.y < lh.y && !leftUp) {
        setState(s => ({ ...s, leftUp: true }));
        setRepCount(c => c + 1);
        flashPose();
      } else if (lk.y >= lh.y) setState(s => ({ ...s, leftUp: false }));

      if (rk.y < rh.y && !rightUp) {
        setState(s => ({ ...s, rightUp: true }));
        setRepCount(c => c + 1);
        flashPose();
      } else if (rk.y >= rh.y) setState(s => ({ ...s, rightUp: false }));
    }

    if (exercise === 'squats') {
      if (lh.y > lk.y && rh.y > rk.y && !isSquatting) {
        setState(s => ({ ...s, isSquatting: true }));
        setRepCount(c => c + 1);
        flashPose();
      } else if (lh.y <= lk.y && rh.y <= rk.y) setState(s => ({ ...s, isSquatting: false }));
    }

    if (exercise === 'lunges') {
      const zDiff = rk.z - lk.z;
      if (zDiff > 0.2 && !isLunging) {
        setState(s => ({ ...s, isLunging: true }));
      } else if (zDiff < 0.05 && isLunging) {
        setState(s => ({ ...s, isLunging: false }));
        setRepCount(c => c + 1);
        flashPose();
      }
    }

    if (exercise === 'calfRaises') {
        const ankleThreshold = 0.02; 
        const currentAvgAnkleY = (la.y + ra.y) / 2;
      
        if (!isRaising && currentAvgAnkleY < 0.5) {
          setState(s => ({ ...s, isRaising: true }));
          setRepCount(c => c + 1);
          flashPose();
        } else if (currentAvgAnkleY > 0.55 && isRaising) {
          setState(s => ({ ...s, isRaising: false }));
        }
      
    }

    if (exercise === 'oneLegSquat') {
      const hipBelowKnee = rh.y > rk.y;
      const otherLegLifted = la.y < lk.y - 0.02;
      if (hipBelowKnee && otherLegLifted && !isOneLegSquatting) {
        setState(s => ({ ...s, isOneLegSquatting: true }));
      } else if (!hipBelowKnee && isOneLegSquatting && otherLegLifted) {
        setState(s => ({ ...s, isOneLegSquatting: false }));
        setRepCount(c => c + 1);
        flashPose();
      }
    }
  };

  // Screens
  if (screen === 'intro') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Pose Tracker</Text>
        <TouchableOpacity onPress={() => setScreen('menu')} style={styles.welcomeButton}>
          <Text style={styles.startText}>Welcome</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>AISRA</Text>
      </View>
    );
  }

  if (screen === 'menu') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Select Exercise</Text>
        {[
          { key: 'highKnees', label: 'High Knees' },
          { key: 'squats', label: 'Squats' },
          { key: 'lunges', label: 'Lunges' },
          { key: 'calfRaises', label: 'Calf Raises' },
          { key: 'oneLegSquat', label: 'One Leg Squat' }
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => startExercise(item.key as Exercise)}
            style={styles.selectButton}
          >
            <Text style={styles.selectText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (screen === 'calibration' || screen === 'countdown' || screen === 'session') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => { resetSession(); setScreen('menu'); }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <RNMediapipe
          key={sessionKey}
          width={400}
          height={600}
          onLandmark={handleLandmarks}
          face={false}
          leftArm={true}
          rightArm={true}
          leftWrist={true}
          rightWrist={true}
          torso={true}
          leftLeg={true}
          rightLeg={true}
          leftAnkle={true}
          rightAnkle={true}
        />
        {poseCorrect && (
        <View style={styles.feedbackOverlay} />
        )}
        {screen === 'calibration' && (
          <>
            <View style={styles.boundingBox} />
            {calibrated && <Text style={styles.checkmark}>✅</Text>}
          </>
        )}

        {screen === 'countdown' && (
          <View style={styles.transparentOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
        )}

        {screen === 'session' && (
          <Text style={styles.counter}>{exerciseLabels[exercise]}: {repCount} / 10 </Text>
        )}
      </View>
    );
  }

  if (screen === 'done') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Great Job!</Text>
        <TouchableOpacity onPress={() => setScreen('menu')} style={styles.resetButton}>
          <Text style={styles.resetText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 42, color: 'white', fontWeight: 'bold', marginBottom: 30 },
  counter: { position: 'absolute', bottom: 60, fontSize: 24, color: 'white', fontWeight: 'bold' },
  welcomeButton: { backgroundColor: '#003366', padding: 14, borderRadius: 8 },
  startText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  selectButton: { backgroundColor: '#444', padding: 12, margin: 8, borderRadius: 8, width: 180, alignItems: 'center' },
  selectText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resetButton: { backgroundColor: '#FF4444', padding: 12, borderRadius: 8, marginTop: 30 },
  resetText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  countdownText: {fontSize: 80, color: 'white', fontWeight: 'bold'},
  footerText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  backText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  boundingBox: {
    position: 'absolute',
    top: '17%',
    left: '15%',
    width: '74%',
    height: '65%',
    borderColor: 'white',
    borderWidth: 2,
    borderStyle: 'dashed',
    zIndex: 50,
  },
  checkmark: {
    position: 'absolute',
    top: '50%',
    fontSize: 48,
    color: 'lime',
    zIndex: 60,
  },
  transparentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(144, 238, 144, 0.4)',
    zIndex: 90,
  },
});

