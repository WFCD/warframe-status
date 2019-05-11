'use strict';

module.exports = (nightwave, deps) => {
  nightwave.activeChallenges.forEach((challenge) => {
    require('./objectLike')(challenge, {
      ...deps,
      eventType: 'nightwave',
    });
  });
};
