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
    // data is entered in chronological order
    this.stepData = {stepsSummary: [], rawData: []};
    // TODO: Track resting heart rate data
  }

  getStepsSummary() {
    return this.stepData.stepsSummary;
  }

  startWorkout(simulatedWatchData) {
    if (!this.workoutInstance) {
      // TODO: stop recording resting heart rate data
      this.workoutInstance = new Workout(simulatedWatchData);
    } else {
      console.log('There is a workout in progress');
    }
  }

  storeStepData(newStepData) {
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newStepData.startTime / secondsPerDay);
    // add steps to last data point or insert
    const lastDataPoint = this.stepData.stepsSummary[this.stepData.stepsSummary.length - 1];
    if (lastDataPoint && lastDataPoint.daysSinceUnixEpoch === daysSinceUnixEpoch) {
      lastDataPoint.steps += newStepData.steps;
    } else {
      this.stepData.stepsSummary.push({
        daysSinceUnixEpoch: daysSinceUnixEpoch,
        steps: newStepData.steps
      });
    }
    this.stepData.rawData.push(newStepData);
  }

  endWorkout() {
    if (this.workoutInstance) {
      // TODO: start recording resting heart rate data
      this.workoutInstance.finishWorkoutRecording();
      const summary = this.workoutInstance.getWorkoutSummary();
      if (summary.workoutType === 'walk') {
        this.storeStepData(summary);
      }
      this.workoutInstance = null;
      return summary;
    } else {
      console.log('There is no workout in progress');
    }
  }

  getMinMaxSteps(nDayPeriod, minOrMax) {
    // TODO: return error if nDayPeriod <= 1
    // nDayPeriod > 1
    // if no step data, return 0
    if (this.stepData.length === 0) {
      return 0;
    } else if (this.stepData.length === 1) {
      return this.stepData[0].steps;
    } else {
      /*
        Summary steps data sample:
        [
          { daysSinceUnixEpoch: 18525, steps: 3484 },
          { daysSinceUnixEpoch: 18526, steps: 2324 }
        ]

        Algorithm:
        2 pointer method over stepsSummary list

      */
      const stepsSummary = this.getStepsSummary();
      let minOrMaxSteps = 0;
      let totalSteps = stepsSummary[0].steps;
      let slowPtr = 0;
      let fastPtr = 1;
      while (fastPtr < stepsSummary.length) {
        const diff = stepsSummary[fastPtr].daysSinceUnixEpoch - stepsSummary[slowPtr].daysSinceUnixEpoch;
        if (diff === nDayPeriod - 1) {
          totalSteps += stepsSummary[fastPtr].steps;
          // enough data collected
          if (!minOrMaxSteps) {
            minOrMaxSteps = totalSteps;
          }
          minOrMaxSteps = Math[minOrMax](minOrMaxSteps, totalSteps);
          slowPtr++;
          fastPtr = slowPtr + 1;
          totalSteps = stepsSummary[slowPtr].steps;
        } else if (diff < nDayPeriod) {
          // collect more steps data
          totalSteps += stepsSummary[fastPtr].steps;
          fastPtr++;
        } else {
          slowPtr++;
          totalSteps = stepsSummary[slowPtr].steps;
          fastPtr = slowPtr + 1;
        }
      }
      return minOrMaxSteps;
    }
  }
}

class TestRunner {
  constructor() {
  }

  runTests(tests) {
    tests.forEach(test => {
      console.log('Title:', test.title);
      console.log('Actual:', test.actual);
      console.log('Expected:', test.expected);
      console.log('Success:', test.actual === test.expected);
      console.log();
    });
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

    this.runTests(tests);
  }

  testMinMaxSteps() {
    let simulatedWatchData = {
      // 20 minute walk
      workoutId: 1,
      workoutType: 'walk',
      startTime: 1600565100,
      endTime: 1600565100,
      stepsData: [200, 210, 220, 260, 270, 240, 220, 216, 240, 248]
    };
    const wearer = new Wearer();
    wearer.startWorkout(simulatedWatchData);
    const workoutSummary1 = wearer.endWorkout();

    simulatedWatchData = {
      // 10 minute walk, same day
      workoutId: 2,
      workoutType: 'walk',
      startTime: 1600565160,
      endTime: 1600565760,
      stepsData: [200, 210, 220, 260, 270]
    };
    wearer.startWorkout(simulatedWatchData);
    const workoutSummary2 = wearer.endWorkout();

    let stepData = wearer.getStepsSummary();
    let lastSummaryDataPoint = stepData[stepData.length - 1];
    console.log('summary data point', lastSummaryDataPoint);
    console.log();

    let tests = [
      {
        title: 'add new step data on same day',
        actual: lastSummaryDataPoint.steps,
        expected: workoutSummary1.steps + workoutSummary2.steps
      }
    ];
    this.runTests(tests);

    simulatedWatchData = {
      // 20 minute walk, next day
      workoutId: 3,
      workoutType: 'walk',
      startTime: 1600651560,
      endTime: 1600652760,
      stepsData: [200, 210, 220, 260, 270, 240, 220, 216, 240, 248]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    tests = [
      {
        title: 'Summary data points should be aggregated if added same day',
        actual: stepData.length,
        expected: 2
      }
    ];
    this.runTests(tests);

    simulatedWatchData = {
      // 10 minute walk, 2 days later
      workoutId: 4,
      workoutType: 'walk',
      startTime: 1600824360,
      endTime: 1600824960,
      stepsData: [150, 160, 170, 155, 165]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    simulatedWatchData = {
      // 10 minute walk, next day
      workoutId: 5,
      workoutType: 'walk',
      startTime: 1600910760,
      endTime: 1600911360,
      stepsData: [150, 160, 170, 155, 165]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    stepData = wearer.getStepsSummary();
    console.log('Summary step data', stepData);
    console.log();

    tests = [
      {
        title: 'Minimum steps over 2 day period',
        actual: wearer.getMinMaxSteps(2, 'min'),
        expected: 1600
      },
      {
        title: 'Maximum steps over 2 day period',
        actual: wearer.getMinMaxSteps(2, 'max'),
        expected: 5808
      },
      {
        title: 'Minimum steps over 5 day period',
        actual: wearer.getMinMaxSteps(5, 'min'),
        expected: 7408
      },
      {
        title: 'Maximum steps over 5 day period',
        actual: wearer.getMinMaxSteps(5, 'max'),
        expected: 7408
      }
    ];
    this.runTests(tests);
  }

  runGroupTests() {
    const tests = [
      {
        title: 'Test single walk workout',
        fn: this.testSingleWalkWorkout
      },
      {
        title: 'Test minimum and maximum steps',
        fn: this.testMinMaxSteps
      }
    ];
    tests.forEach((test, testIndex) => {
      console.log('--------------------------------------------------');
      console.log(`Test ${testIndex + 1}: ${test.title}`);
      test.fn.apply(this);
    });
  }
}

const testRunner = new TestRunner();
testRunner.runGroupTests();