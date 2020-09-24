const Workout = require('./Workout');

/**
 * Class representing a wearer.
 */
class Wearer {
  /**
   * Create a wearer.
   * @param {object} simulatedWatchData - Data for simulating a workout.
   */
  constructor(simulatedWatchData) {
    this.workoutInstance = null;
    // data is entered in chronological order
    this.stepsData = {summary: [], rawData: []};
    this.caloriesBurnedData = {summary: [], rawData: []};
    this.heartRateData = {rawData: {resting: [], active: []}};
    this.isResting = true;

    if (simulatedWatchData) {
      this.processSimulatedData(simulatedWatchData);
    }
  }

  /**
   * Process simulated data.
   * @param {object} simulatedWatchData - Data for simulating a workout.
   */
  processSimulatedData(simulatedWatchData) {
    const {heartRateData} = simulatedWatchData;
    if (heartRateData) {
      let timeWhenMeasured = heartRateData.startTime;
      heartRateData.heartRate.forEach(heartRate => {
        this.storeHeartRateData({
          timeWhenMeasured: timeWhenMeasured,
          heartRate: heartRate
        });
        timeWhenMeasured += 60;
      });
    }
  }

  /**
   * Get summary data.
   * @param {string} dataCategory - Data category ("steps", "caloriesBurned", or "heartRate").
   */
  getDataSummary(dataCategory) {
    let dataSource = this[`${dataCategory}Data`];
    if (dataCategory !== 'heartRate') {
      dataSource = dataSource.summary;
    }
    return dataSource;
  }

  /**
   * Start a workout.
   * @param {object} simulatedWatchData - Data for simulating a workout.
   */
  startWorkout(simulatedWatchData) {
    if (!this.workoutInstance) {
      this.isResting = false;
      this.workoutInstance = new Workout(simulatedWatchData);
    } else {
      console.log('There is a workout in progress');
    }
  }

  /**
   * Store data (steps, calories burned).
   * @param {object} newData - Data for steps or calories burned.
   * @param {string} dataCategory - Data category ("steps" or "caloriesBurned").
   */
  storeData(newData, dataCategory) {
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newData.startTime / secondsPerDay)

    const source = this[`${dataCategory}Data`];
    const lastDataPoint = source.summary[source.summary.length - 1];
    if (lastDataPoint && lastDataPoint.daysSinceUnixEpoch === daysSinceUnixEpoch) {
      lastDataPoint[dataCategory] += newData[dataCategory];
    } else {
      let payload = {
        daysSinceUnixEpoch: daysSinceUnixEpoch,
        [dataCategory]: newData[dataCategory]
      };
      if (dataCategory === 'caloriesBurned') {
        payload.workoutType = newData.workoutType;
      }
      source.summary.push(payload);
    }
    source.rawData.push(newData);
  }

  /**
   * Store heart rate data.
   * @param {object} newHeartRateData - Data for heart rate.
   */
  storeHeartRateData(newHeartRateData) {
    /*
      {
        timeWhenMeasured: Number (UNIX timestamp),
        heartRate: Number
      }
     */
    const secondsPerDay = 86400;
    const daysSinceUnixEpoch = Math.floor(newHeartRateData.timeWhenMeasured / secondsPerDay);
    const newData = Object.assign({}, newHeartRateData, {daysSinceUnixEpoch: daysSinceUnixEpoch});
    const dataCategory = this.isResting ? 'resting' : 'active';
    this.heartRateData.rawData[dataCategory].push(newData);
  }

  /**
   * End a workout.
   */
  endWorkout() {
    if (this.workoutInstance) {
      this.isResting = true;
      this.workoutInstance.finishWorkoutRecording();
      const summary = this.workoutInstance.getWorkoutSummary();
      this.storeData(summary, 'steps');
      this.storeData(summary, 'caloriesBurned');
      this.workoutInstance = null;
      return summary;
    } else {
      console.log('There is no workout in progress');
    }
  }

  /**
   * Get minimum or maximum steps for a wearer over N day period.
   * @param {number} nDayPeriod - N day period > 1.
   * @param {string} minOrMax - The string "min" or "max".
   * @return {number} Minimum or maximum steps over N day period.
   */
  getMinMaxSteps(nDayPeriod, minOrMax) {
    // if no step data, return 0
    if (this.stepsData.length === 0) {
      return 0;
    } else if (this.stepsData.length === 1) {
      return this.stepsData[0].steps;
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
      const stepsSummary = this.getDataSummary('steps');
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

  /**
   * Get average number of steps for a wearer over N day period.
   * @param {number} nDayPeriod - N day period > 1.
   * @return {number} Average number of steps over N day period.
   */
  getAverageNumberOfSteps(nDayPeriod) {
    /*
     * 1. track number of complete N day periods
     * 2. store running total of steps for complete N day periods
     * 3. divide number of complete periods by running total
     */
    if (this.stepsData.length === 0) {
      return 0;
    } else if (this.stepsData.length === 1) {
      return this.stepsData[0].steps;
    } else {
      let completeNDayPeriods = 0;
      let totalStepsForCompleteNDayPeriods = 0;

      const stepsSummary = this.getDataSummary('steps');
      let totalSteps = stepsSummary[0].steps;
      let slowPtr = 0;
      let fastPtr = 1;
      while (fastPtr < stepsSummary.length) {
        const diff = stepsSummary[fastPtr].daysSinceUnixEpoch - stepsSummary[slowPtr].daysSinceUnixEpoch;
        if (diff === nDayPeriod - 1) {
          totalSteps += stepsSummary[fastPtr].steps;
          // enough data collected
          completeNDayPeriods++;
          totalStepsForCompleteNDayPeriods += totalSteps;

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

      if (completeNDayPeriods === 0) {
        return 0;
      } else {
        return totalStepsForCompleteNDayPeriods / completeNDayPeriods;
      }
    }
  }

  /**
   * Get average resting heart rate for a wearer over N day period.
   * @param {number} nDayPeriod - N day period > 0.
   * @return {number} Average resting heart rate over N day period.
   */
  getAverageRestingHeartRate(nDayPeriod) {
    const heartRateDataList = this.getDataSummary('heartRate').rawData.resting;
    if (heartRateDataList.length === 0) {
      return 0;
    } else {
      let lastSeenDaysSinceUnixEpoch = heartRateDataList[0].daysSinceUnixEpoch;
      let countOfNDayPeriods = 1;
      let averageHeartRateData = [];
      let totalHeartRateBpmInNDayPeriod = 0;
      let countOfDataPointsInNDayPeriod = 0;

      heartRateDataList.forEach(heartRateData => {
        if (heartRateData.daysSinceUnixEpoch === lastSeenDaysSinceUnixEpoch) {
          // collect more data
          totalHeartRateBpmInNDayPeriod += heartRateData.heartRate;
          countOfDataPointsInNDayPeriod++;
        } else {
          // bank collected data
          averageHeartRateData.push(totalHeartRateBpmInNDayPeriod / countOfDataPointsInNDayPeriod);

          countOfNDayPeriods++
          // reset
          totalHeartRateBpmInNDayPeriod = 0;
          countOfDataPointsInNDayPeriod = 0;
        }
      });
      // bank last set of data
      if (countOfDataPointsInNDayPeriod) {
        averageHeartRateData.push(totalHeartRateBpmInNDayPeriod / countOfDataPointsInNDayPeriod);
      }
      return averageHeartRateData.reduce((acc, cur, curIndex, arr) => {
        acc += cur;
        if (curIndex === arr.length - 1) {
          acc = acc / arr.length;
        }
        return acc;
      }, 0);
    }
  }

  /**
   * Get average calories burned per workout for each workout type over N day period.
   * @param {number} nDayPeriod - N day period > 0.
   * @param {string} workoutType - The string representing the workout type (Ex: "walk").
   * @return {number} Average calories burned per workout for each workout type over N day period.
   */
  getAverageCaloriesBurnedPerWorkout(nDayPeriod, workoutType) {
    const caloriesBurnedDataList = this.getDataSummary('caloriesBurned')
      .filter(data => data.workoutType === workoutType);

    let completeNDayPeriods = 0;
    let totalCaloriesBurnedForCompleteNDayPeriods = 0;

    let totalCaloriesBurned = caloriesBurnedDataList[0].caloriesBurned;
    let countOfDataPointsInNDayPeriod = 1;
    let slowPtr = 0;
    let fastPtr = 1;
    while (fastPtr < caloriesBurnedDataList.length) {
      const diff = caloriesBurnedDataList[fastPtr].daysSinceUnixEpoch - caloriesBurnedDataList[slowPtr].daysSinceUnixEpoch;
      if (diff === nDayPeriod - 1) {
        totalCaloriesBurned += caloriesBurnedDataList[fastPtr].caloriesBurned;
        // enough data collected
        completeNDayPeriods++;
        totalCaloriesBurnedForCompleteNDayPeriods += totalCaloriesBurned;

        slowPtr++;
        fastPtr = slowPtr + 1;
        totalCaloriesBurned = caloriesBurnedDataList[slowPtr].caloriesBurned;
      } else if (diff < nDayPeriod) {
        // collect more data
        totalCaloriesBurned += caloriesBurnedDataList[fastPtr].caloriesBurned;
        countOfDataPointsInNDayPeriod++;
        fastPtr++;
      } else {
        slowPtr++;
        totalCaloriesBurned = caloriesBurnedDataList[slowPtr].caloriesBurned;
        fastPtr = slowPtr + 1;
      }
    }

    if (completeNDayPeriods === 0) {
      return 0;
    } else {
      return totalCaloriesBurnedForCompleteNDayPeriods / countOfDataPointsInNDayPeriod;
    }
  }
}

module.exports = Wearer;
