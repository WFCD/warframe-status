'use strict';

module.exports = (nightwave, deps) => {
  const groups = {
    daily: [],
    weekly: [],
    elite: [],
  };

  nightwave.activeChallenges.forEach((challenge) => {
    if (challenge.isDaily) {
      groups.daily.push(challenge);
    } else if (challenge.isElite) {
      groups.elite.push(challenge);
    } else {
      groups.weekly.push(challenge);
    }
  });

  Object.keys(groups).forEach((group) => {
    require('./objectLike')({
      ...nightwave,
      activeChallenges: groups[group],
    }, {
      ...deps,
      eventKey: `nightwave.${group}`,
    });
  });
};
