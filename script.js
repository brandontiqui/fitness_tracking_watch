class Workout {
  constructor(simulatedWatchData) {
    this.workoutId = null;
    this.workoutType = null;
    this.startTime = null;
    this.endTime = null;
    this.caloriesBurned = 0;
    this.steps = 0;
    this.simulatedWatchData = simulatedWatchData;

    this.startWorkoutRecording();
    this.processSimulatedData();
  }

  addCaloriesBurned(caloriesData) {
    this.caloriesBurned += caloriesData.additionalCaloriesBurned;
  }

  addSteps(stepsData) {
    this.steps += stepsData.additionalSteps;
  }

  startWorkoutRecording(watchData) {
    const data = watchData || this.simulatedWatchData;
    this.workoutType = data.workoutType;
    this.startTime = data.startTime;
  }

  processSimulatedData() {
    const {caloriesBurnedData, stepsData, heartRateData} = this.simulatedWatchData;
    if (caloriesBurnedData) {
      caloriesBurnedData.forEach(calories => {
        this.addCaloriesBurned({additionalCaloriesBurned: calories});
      });
    }
    if (stepsData) {
      stepsData.forEach(steps => {
        this.addSteps({additionalSteps: steps});
      });
    }
  }

  finishWorkoutRecording(watchData) {
    const data = watchData || this.simulatedWatchData;
    this.workoutId = data.workoutId;
    this.endTime = data.endTime;
  }

  getWorkoutSummary() {
    return {
      workoutId: this.workoutId,
      workoutType: this.workoutType,
      startTime: this.startTime,
      endTime: this.endTime,
      caloriesBurned: this.caloriesBurned,
      steps: this.steps
    };
  }
}

class Wearer {
  constructor() {
    this.workoutInstance = null;

    // TODO: Track resting heart rate data
  }

  startWorkout(simulatedWatchData) {
    if (!this.workoutInstance) {
      // TODO: stop recording resting heart rate data
      this.workoutInstance = new Workout(simulatedWatchData);
    } else {
      console.log('There is a workout in progress');
    }
  }

  endWorkout() {
    if (this.workoutInstance) {
      // TODO: start recording resting heart rate data
      this.workoutInstance.finishWorkoutRecording();
      const summary = this.workoutInstance.getWorkoutSummary();
      this.workoutInstance = null;
      return summary;
    } else {
      console.log('There is no workout in progress');
    }
  }
}

class TestRunner {
  constructor() {
  }

  testSingleWalkWorkout(wearer) {
    const simulatedWatchData = {
      // 20 minute walk
      workoutId: 1,
      workoutType: 'walk',
      startTime: 1600565100,
      endTime: 1600565100,
      caloriesBurnedData: [12, 14, 16, 18, 14, 16, 12, 16, 18, 16],
      stepsData: [200, 210, 220, 260, 270, 240, 220, 216, 240, 248]
    };

    wearer = wearer || new Wearer();
    wearer.startWorkout(simulatedWatchData);
    const workoutSummary = wearer.endWorkout();
    console.log('workout summary:', workoutSummary);
    console.log();

    const tests = [
      {
        title: 'workout type',
        actual: workoutSummary.workoutType,
        expected: simulatedWatchData.workoutType
      },
      {
        title: 'total calories burned',
        actual: workoutSummary.caloriesBurned,
        expected: simulatedWatchData.caloriesBurnedData.reduce((acc, cur) => acc + cur)
      },
      {
        title: 'total steps',
        actual: workoutSummary.steps,
        expected: simulatedWatchData.stepsData.reduce((acc, cur) => acc + cur)
      }
    ];

    tests.forEach(test => {
      console.log('Title:', test.title);
      console.log('Actual:', test.actual);
      console.log('Expected:', test.expected);
      console.log('Success:', test.actual === test.expected);
      console.log();
    });
  }

  runAllTests() {
    const tests = [
      {
        title: 'Test single walk workout',
        fn: this.testSingleWalkWorkout
      }
    ];
    tests.forEach((test, testIndex) => {
      console.log('--------------------------------------------------');
      console.log(`Test ${testIndex + 1}: ${test.title}`);
      test.fn();
    });
  }
}

const testRunner = new TestRunner();
testRunner.runAllTests();