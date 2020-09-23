const Workout = require('./Workout');
const Wearer = require('./Wearer');

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

  testStepsStats() {
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
      },
      {
        title: 'Average number of steps over 2 day period',
        actual: wearer.getAverageNumberOfSteps(2),
        expected: 3704
      },
      {
        title: 'Average number of steps over 5 day period',
        actual: wearer.getAverageNumberOfSteps(5),
        expected: 7408
      }
    ];
    this.runTests(tests);
  }

  testHeartRateStats() {
    let simulatedData = {
      heartRateData: {
        // 10 rest period
        startTime: 1600565160,
        heartRate: [70, 75, 70, 72, 73, 71, 77, 79, 78, 76]
      }
    }
    const wearer = new Wearer(simulatedData);
    const heartRateData = wearer.getHeartRateData();
    console.log('Heart rate data', JSON.stringify(heartRateData, null, 2));
    console.log();

    let tests = [
      {
        title: 'Simulated resting heart rate data should be available',
        actual: heartRateData.rawData.resting.length,
        expected: 10
      },
      {
        title: 'Average heart rate over 1 day period',
        actual: wearer.getAverageRestingHeartRate(1),
        expected: simulatedData.heartRateData.heartRate.reduce((acc, cur) => acc + cur) / simulatedData.heartRateData.heartRate.length
      }
    ];
    this.runTests(tests);
  }

  testCaloriesStats() {
    const dataCategory = 'caloriesBurned';

    let simulatedWatchData = {
      // 20 minute walk
      workoutId: 1,
      workoutType: 'walk',
      startTime: 1600565100,
      endTime: 1600565100,
      caloriesBurnedData: [12, 14, 16, 18, 14, 16, 12, 16, 18, 16],
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
      caloriesBurnedData: [11, 13, 15, 17, 13],
      stepsData: [200, 210, 220, 260, 270]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    simulatedWatchData = {
      // 10 minute walk, 2 days later
      workoutId: 3,
      workoutType: 'walk',
      startTime: 1600824360,
      endTime: 1600824960,
      caloriesBurnedData: [12, 14, 16, 18, 14],
      stepsData: [150, 160, 170, 155, 165]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    simulatedWatchData = {
      // 10 minute walk, next day
      workoutId: 4,
      workoutType: 'walk',
      startTime: 1600910760,
      endTime: 1600911360,
      caloriesBurnedData: [12, 14, 16, 18, 14],
      stepsData: [150, 160, 170, 155, 165]
    };
    wearer.startWorkout(simulatedWatchData);
    wearer.endWorkout();

    const dataSummary = wearer.getDataSummary(dataCategory);
    console.log('Summary data', dataSummary);
    console.log();

    let tests = [
      {
        title: 'Average calories burned per walk workout over 5 day period',
        actual: wearer.getAverageCaloriesBurnedPerWorkout(5, 'walk'),
        expected: 123
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
        title: 'Test minimum, maximum, and average steps',
        fn: this.testStepsStats
      },
      {
        title: 'Test average heart rate',
        fn: this.testHeartRateStats
      },
      {
        title: 'Test average calories per workout for each workout type',
        fn: this.testCaloriesStats
      }
    ];
    tests.forEach((test, testIndex) => {
      console.log('--------------------------------------------------');
      console.log(`Test ${testIndex + 1}: ${test.title}`);
      test.fn.apply(this);
    });
  }
}

module.exports = TestRunner;
