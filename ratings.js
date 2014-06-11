// Polyfill for Math.sign
// http://tc39wiki.calculist.org/es6/math/
(function (global) {
  var isNaN = Number.isNaN;

  Object.defineProperty(Math, 'sign', {
    value: function sign(value) {
      var n = +value;
      if (isNaN(n))
        return n /* NaN */;

      if (n === 0)
        return n; // Keep the sign of the zero.

      return (n < 0) ? -1 : 1;
    },
    configurable: true,
    enumerable: false,
    writable: true
  });
})(this);



/*
 * Rating Systems
 * Each rating system is encapsulated by itself.
 * The idea is that each may be its own server-side module/API
 * or may be separated into its own file/requirejs module.
 * For the sake of this exercise, all modules are enumerated inline.
 */

var RatingSystems = {
  games: [],
  systems: {},
  register: function(system) {
    this.systems[system.systemName] = system;
  },
  addGame: function(game) {
    this.games.push(game);
    _.each(this.systems, function(system) {
      system.addGame(game);
    });
  },
  ratings: function() {
    return _.object(_.map(this.systems, function(system) {
      return [system.systemName, _.clone(system.ratings)];
    }));
  },
  currentRatings: function() {
    return _.object(_.map(this.systems, function(system) {
      var ratings = _.sortBy(_.map(system.currentRatings(), function(score, name) {
        return {name: name, score: score};
      }), 'score').reverse();
      return [system.systemName, ratings];
    }));
  },
  history: function() {
    return this.games;
  },
  playerHistory: function(player) {
    return _.object(_.map(this.systems, function(system) {
      return [system.systemName, system.playerHistory(player)];
    }));
  }
};

// Net Promoter Score
// Promoters: won by margin >= 2
// Ignored: tied or won by margin of 1
// Detractors: lost
RatingSystems.register({
  systemName: 'Net Promoter Score',
  ratings: {},
  registerPlayer: function(player) {
    if (!_.has(this.ratings, player)) {
      this.ratings[player] = [{rating: 0, games: 0, promoters: 0, detractors: 0}];
    }
  },
  currentRatings: function() {
    return _.object(_.map(this.ratings, (function(ratings, player) {
      return [player, this.currentRating(player).rating];
    }).bind(this)));
  },
  currentRating: function(player) {
    return _.clone(_.last(this.ratings[player]));
  },
  playerHistory: function(player) {
    return _.clone(this.ratings[player]);
  },
  addRating: function(player, rating) {
    this.ratings[player].push(rating);
  },
  addGame: function(game) {
    this.registerPlayer(game.player1);
    this.registerPlayer(game.player2);
    var rating1 = this.currentRating(game.player1);
    var rating2 = this.currentRating(game.player2);

    if (game.score1 > game.score2) {
      rating2.detractors++;
      if (game.score1 - game.score2 >= 2) {
        rating1.promoters++;
      }
    }
    else if (game.score2 > game.score1) {
      rating1.detractors++;
      if (game.score2 - game.score1 >= 2) {
        rating2.promoters++;
      }
    }
    rating1.games++;
    rating2.games++;
    rating1.rating = (100 / rating1.games) * (rating1.promoters - rating1.detractors);
    rating2.rating = (100 / rating2.games) * (rating2.promoters - rating2.detractors);
    this.addRating(game.player1, rating1);
    this.addRating(game.player2, rating2);
  }
});

// Wins Minus Losses
RatingSystems.register({
  systemName: 'Wins Minus Losses',
  ratings: {},
  registerPlayer: function(player) {
    if (!_.has(this.ratings, player)) {
      this.ratings[player] = [{rating: 0}];
    }
  },
  currentRatings: function() {
    return _.object(_.map(this.ratings, (function(ratings, player) {
      return [player, this.currentRating(player).rating];
    }).bind(this)));
  },
  currentRating: function(player) {
    return _.clone(_.last(this.ratings[player]));
  },
  playerHistory: function(player) {
    return _.clone(this.ratings[player]);
  },
  addRating: function(player, rating) {
    this.ratings[player].push(rating);
  },
  addGame: function(game) {
    this.registerPlayer(game.player1);
    this.registerPlayer(game.player2);
    var rating1 = this.currentRating(game.player1);
    var rating2 = this.currentRating(game.player2);

    if (game.score1 > game.score2) {
      rating1.rating++;
      rating2.rating--;
    }
    else if (game.score2 > game.score1) {
      rating1.rating--;
      rating2.rating++;
    }
    this.addRating(game.player1, rating1);
    this.addRating(game.player2, rating2);
  }
});

// RPI
// http://en.wikipedia.org/wiki/Rating_Percentage_Index
RatingSystems.register({
  systemName: 'Rating Percentage Index',
  ratings: {},
  games: [],
  registerPlayer: function(player) {
    if (!_.has(this.ratings, player)) {
      this.ratings[player] = [{rating: 0}];
    }
  },
  currentRatings: function() {
    return _.object(_.map(this.ratings, (function(ratings, player) {
      return [player, this.currentRating(player).rating];
    }).bind(this)));
  },
  currentRating: function(player) {
    return _.clone(_.last(this.ratings[player]));
  },
  playerHistory: function(player) {
    return _.clone(this.ratings[player]);
  },
  addRating: function(player, rating) {
    this.ratings[player].push(rating);
  },
  addGame: function(game) {
    this.registerPlayer(game.player1);
    this.registerPlayer(game.player2);
    this.games.push(game);
    var players = _.reduce(this.games, function(players, game) {
      players[game.player1] = players[game.player1] || {wins:0, games:0};
      players[game.player2] = players[game.player2] || {wins:0, games:0};
      if (game.score1 > game.score2) {
        players[game.player1].wins++;
      }
      else if (game.score1 < game.score2) {
        players[game.player2].wins++;
      }
      players[game.player1].games++;
      players[game.player2].games++;
      return players;
    }, {});
    _.each(players, function(playerRecord, playerName) {
      playerRecord.WP = playerRecord.wins / playerRecord.games || 0;
    });
    var OWPMap = {};
    _.each(players, function(playerRecord, playerName) {
      OWPMap[playerName] = {};
      _.each(players, function(opponentRecord, opponentName) {
        if (playerName == opponentName) {
          return;
        }
        OWPMap[playerName][opponentName] = {wins: opponentRecord.wins, games: opponentRecord.games};
      });
    });
    _.each(this.games, function(game) {
      if (game.score1 > game.score2) {
        OWPMap[game.player2][game.player1].wins--;
      }
      else if (game.score1 < game.score2) {
        OWPMap[game.player1][game.player2].wins--;
      }
      OWPMap[game.player1][game.player2].games--;
      OWPMap[game.player2][game.player1].games--;
    });
    _.each(players, function(playerRecord, playerName) {
      _.each(OWPMap[playerName], function(opponentRecord, opponentName) {
        OWPMap[playerName][opponentName] = opponentRecord.wins / opponentRecord.games || 0
      });
    });
    var OWPSum = {};
    _.each(this.games, function(game) {
      OWPSum[game.player1] = OWPSum[game.player1] || 0;
      OWPSum[game.player2] = OWPSum[game.player2] || 0;
      OWPSum[game.player1] += OWPMap[game.player2][game.player1];
      OWPSum[game.player2] += OWPMap[game.player1][game.player2];
    });
    _.each(players, function(playerRecord, playerName) {
      playerRecord.OWP = OWPSum[playerName] / playerRecord.games;
    });
    var OOWPSum = {};
    _.each(this.games, function(game) {
      OOWPSum[game.player1] = OOWPSum[game.player1] || 0;
      OOWPSum[game.player2] = OOWPSum[game.player2] || 0;
      OOWPSum[game.player1] += players[game.player2].OWP;
      OOWPSum[game.player2] += players[game.player1].OWP;
    });
    _.each(players, function(playerRecord, playerName) {
      playerRecord.OOWP = OOWPSum[playerName] / playerRecord.games;
      playerRecord.rating = 100 * ( (playerRecord.WP * 0.25) + (playerRecord.OWP * 0.5) + (playerRecord.OOWP * 0.25) );
    });
    
    this.addRating(game.player1, players[game.player1]);
    this.addRating(game.player2, players[game.player2]);
  }
});

// Elo
// http://en.wikipedia.org/wiki/Elo_rating_system
// Initial rating 1200
// First 5 game are "provisional", average of +-200 opponents
// K = 20
RatingSystems.register({
  systemName: 'Elo',
  ratings: {},
  registerPlayer: function(player) {
    if (!_.has(this.ratings, player)) {
      this.ratings[player] = [{rating: 1200}];
    }
  },
  isProvisional: function(player) {
    return this.ratings[player].length < 5;
  },
  currentRatings: function() {
    return _.object(_.map(this.ratings, (function(ratings, player) {
      return [player, this.currentRating(player).rating];
    }).bind(this)));
  },
  currentRating: function(player) {
    return _.clone(_.last(this.ratings[player]));
  },
  playerHistory: function(player) {
    return _.clone(this.ratings[player]);
  },
  addRating: function(player, rating) {
    this.ratings[player].push(rating);
  },
  addGame: function(game) {
    this.registerPlayer(game.player1);
    this.registerPlayer(game.player2);
    
    var player1 = {
      game: game,
      rating: this.currentRating(game.player1).rating,
      ratings: this.ratings[game.player1].length,
      provisional: this.isProvisional(game.player1)
    };
    var player2 = {
      game: game,
      rating: this.currentRating(game.player2).rating,
      ratings: this.ratings[game.player2].length,
      provisional: this.isProvisional(game.player2)
    };
    // Actual outcome; -1:loss, 0:tie, 1:win
    player1.outcome = Math.sign(game.score1 - game.score2);
    player2.outcome = -player1.outcome;
    // Points given: 0:loss, 0.5:tie, 1:win
    player1.points = (1 + player1.outcome) / 2;
    player2.points = 1 - player1.points;
    
    // Expected probability of player1 winning; [0.0, 1.0].
    player1.quotient = Math.pow(10.0, player1.rating/400.0);
    player2.quotient = Math.pow(10.0, player2.rating/400.0);
    player1.expected = player1.quotient / (player1.quotient + player2.quotient);
    player2.expected = 1 - player1.expected;
    
    // http://stackoverflow.com/a/1926064/1253312
    if (player1.provisional) {
      player1.points = (
          (player1.rating * player1.ratings)
          + player2.rating
          + ((player2.provisional ? 200 : 400) * player1.outcome)
        ) / (player1.ratings + 1)
        - player1.rating;
    }
    else {
      player1.points = 20*(player1.points - player1.expected);
    }
    if (player2.provisional) {
      player2.points = (
          (player2.rating * player2.ratings)
          + player1.rating
          + ((player1.provisional ? 200 : 400) * player2.outcome)
        ) / (player2.ratings + 1)
        - player2.rating;
    }
    else {
      player2.points = 20*(player2.points - player2.expected);
    }
    
    player1.rating += player1.points;
    player2.rating += player2.points;
    
    this.addRating(game.player1, player1);
    this.addRating(game.player2, player2);
  }
});

var games = [{"player1":"Alex","score1":4,"player2":"Barrett","score2":5},{"player1":"Alex","score1":1,"player2":"Barrett","score2":5},{"player1":"Alex","score1":2,"player2":"Barrett","score2":5},{"player1":"Alex","score1":0,"player2":"Barrett","score2":5},{"player1":"Alex","score1":6,"player2":"Barrett","score2":5},{"player1":"Alex","score1":5,"player2":"Barrett","score2":2},{"player1":"Alex","score1":4,"player2":"Barrett","score2":0},{"player1":"Joel","score1":4,"player2":"Barrett","score2":5},{"player1":"Tim","score1":4,"player2":"Alex","score2":5},{"player1":"Tim","score1":5,"player2":"Alex","score2":2},{"player1":"Alex","score1":3,"player2":"Tim","score2":5},{"player1":"Alex","score1":5,"player2":"Tim","score2":3},{"player1":"Alex","score1":5,"player2":"Joel","score2":4},{"player1":"Joel","score1":5,"player2":"Tim","score2":2}];

_.each(games, function(game) {
  RatingSystems.addGame(game);
});

