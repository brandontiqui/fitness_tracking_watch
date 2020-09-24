/**
 * Class representing a workout.
 */
class Workout {
  /**
   * Create a workout.
   * @param {object} simulatedWatchData - Data for simulating a workout.
   */
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

  /**
   * Track total calories burned for a workout.
   * @param {object} caloriesData - Calories Burned recording sent by watch every 2 minutes.
   */
  addCaloriesBurned(caloriesData) {
    /*
      {
        additionalCaloriesBurned: Number
      }
     */
    this.caloriesBurned += caloriesData.additionalCaloriesBurned;
  }

  /**
   * Track total steps for a workout.
   * @param {object} stepsData - Additional step recording sent by watch every 2 minutes.
   */
  addSteps(stepsData) {
    /*
      {
        additionalSteps: Number
      }
     */
    this.steps += stepsData.additionalSteps;
  }

  /**
   * Start workout recording.
   * @param {object} watchData - Sent by watch when user starts a workout.
   */
  startWorkoutRecording(watchData) {
    /*
      {
        workoutType: String
        startTime: Long (UNIX timestamp)
      }
     */
    const data = watchData || this.simulatedWatchData;
    this.workoutType = data.workoutType;
    this.startTime = data.startTime;
  }

  /**
   * Process simulated data.
   */
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

  /**
   * Finish workout recording.
   * @param {object} watchData - Sent by watch when user finishes a workout.
   */
  finishWorkoutRecording(watchData) {
    const data = watchData || this.simulatedWatchData;
    this.workoutId = data.workoutId;
    this.endTime = data.endTime;
  }

  /**
   * Get workout summary.
   * @return {object} Data related to the completed workout.
   */
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

module.exports = Workout;
