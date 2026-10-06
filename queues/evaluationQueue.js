import Evaluation from "../models/Evaluation.js";
import Attempt from "../models/Attempt.js";
import Submission from "../models/Submission.js";

export const evaluationQueue = {
  add: async (attemptId) => {
    setImmediate(
      async () => {
        try {
          const attempt =
            await Attempt.findById(
              attemptId
            );

          if (!attempt) {
            return;
          }

          const submissions =
            await Submission.find({
              attempt:
                attempt._id
            });

          console.log(
            `Evaluation job started for ${attemptId}`
          );

          console.log(
            `Processing ${submissions.length} submissions`
          );

          await Evaluation.findOneAndUpdate(
            {
              attempt:
                attempt._id
            },
            {
              attempt:
                attempt._id
            },
            {
              upsert: true
            }
          );

          console.log(
            `Evaluation job completed for ${attemptId}`
          );
        } catch (error) {
          console.error(
            "Evaluation queue error:",
            error.message
          );
        }
      }
    );
  }
};