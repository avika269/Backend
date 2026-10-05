import Drive from "../models/Drive.js";

export const createDrive = async (
  req,
  res
) => {
  const drive =
    await Drive.create({
      ...req.body,
      createdBy: req.user.id
    });

  res.status(201).json({
    success: true,
    message: "Drive created",
    data: { drive }
  });
};

export const getDrives = async (
  req,
  res
) => {
  const drives =
    await Drive.find({
      isActive: true
    }).populate(
      "createdBy",
      "name email"
    );

  res.json({
    success: true,
    data: { drives }
  });
};

export const getDrive = async (
  req,
  res
) => {
  const drive =
    await Drive.findById(
      req.params.id
    ).populate(
      "createdBy",
      "name email"
    );

  if (!drive) {
    return res.status(404).json({
      success: false,
      message: "Drive not found"
    });
  }

  res.json({
    success: true,
    data: { drive }
  });
};

export const updateDrive = async (
  req,
  res
) => {
  const drive =
    await Drive.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

  if (!drive) {
    return res.status(404).json({
      success: false,
      message: "Drive not found"
    });
  }

  res.json({
    success: true,
    message: "Drive updated",
    data: { drive }
  });
};

export const deleteDrive = async (
  req,
  res
) => {
  const drive =
    await Drive.findByIdAndDelete(
      req.params.id
    );

  if (!drive) {
    return res.status(404).json({
      success: false,
      message: "Drive not found"
    });
  }

  res.json({
    success: true,
    message: "Drive deleted"
  });
};

export const inviteCandidate = async (
  req,
  res
) => {
  const {
    candidateId
  } = req.body;

  const drive =
    await Drive.findById(
      req.params.id
    );

  if (!drive) {
    return res.status(404).json({
      success: false,
      message: "Drive not found"
    });
  }

  if (
    !drive.invitedCandidates
      .map(String)
      .includes(String(candidateId))
  ) {
    drive.invitedCandidates.push(
      candidateId
    );

    await drive.save();
  }

  res.json({
    success: true,
    message: "Candidate invited",
    data: { drive }
  });
};