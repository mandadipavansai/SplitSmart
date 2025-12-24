const Group = require('../models/Group');
const User = require('../models/User');

// 1. Create Group
exports.createGroup = async (req, res) => {
  try {
    const { name, memberNames } = req.body; 
    const user = await User.findById(req.user.id);

    // Creator is always first member
    const members = [{ name: user.name, userId: user._id }];

    if (memberNames && memberNames.length > 0) {
      memberNames.forEach(guestName => members.push({ name: guestName }));
    }

    const newGroup = new Group({ name, members, createdBy: req.user.id });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Add Member (With Duplicate Check)
exports.addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Check for duplicate name
    const exists = group.members.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ msg: 'Member already exists!' });

    group.members.push({ name });
    await group.save();

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Remove Member (NEW)
exports.removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: { _id: memberId } } },
      { new: true }
    );

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Get Groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ "members.userId": req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};