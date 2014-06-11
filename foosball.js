Backbone.View.prototype.buildFooter = function() {
  var $footer = $('<div>'+_.template($('#footer-template').html())()+'</div>');
  return _.map(this.footerButtons, function(footerButton) {
    return $footer.find('[data-action='+footerButton+']');
  });
};

var HomeView = Backbone.View.extend({
  template: _.template($('#container-template').html()),
  contentTemplate: _.template($('#navigation-template').html()),
  header: 'Foosball',
  events: {
    'click [data-ref=new-game]': 'newGame',
    'click [data-ref=history]': 'history',
    'click [data-ref=rankings]': 'rankings'
  },
  initialize: function() {
  },
  render: function() {
    this.$el.html(this.template());
    this.$('#header h3').html(this.header);
    this.$('#content').html(this.contentTemplate());
    this.$('#footer').empty().append(this.buildFooter());
  },
  newGame: function() {
    router.navigate('new_game', {trigger: true});
  },
  history: function() {
    router.navigate('history', {trigger: true});
  },
  rankings: function() {
    router.navigate('rankings', {trigger: true});
  }
});

var NewGameView = Backbone.View.extend({
  template: _.template($('#container-template').html()),
  contentTemplate: _.template($('#new-game-template').html()),
  header: 'New Game',
  footerButtons: ['cancel', 'done'],
  events: {
    'click [data-action=cancel]': 'cancelButton',
    'click [data-action=done]': 'doneButton',
    'click .subtract': 'subtract',
    'click .add': 'add'
  },
  initialize: function() {
  },
  render: function() {
    this.$el.html(this.template());
    this.$('#header h3').html(this.header);
    this.$('#content').html(this.contentTemplate());
    this.$('#footer').empty().append(this.buildFooter());
  },
  cancelButton: function() {
    router.navigate('', {trigger: true});
  },
  doneButton: function() {
    RatingSystems.addGame({
      player1: this.$('#player1').val(),
      score1: this.$('#score1').text(),
      player2: this.$('#player2').val(),
      score2: this.$('#score2').text()
    });
    router.navigate('', {trigger: true});
  },
  subtract: function(e) {
    var score = this.$('#'+$(e.target).data('ref'));
    score.text(+score.text()-1);
  },
  add: function(e) {
    var score = this.$('#'+$(e.target).data('ref'));
    score.text(+score.text()+1);
  }
});

var RankingsView = Backbone.View.extend({
  template: _.template($('#container-template').html()),
  contentTemplate: _.template($('#rankings-template').html()),
  rankingsListTemplate: _.template($('#rankings-list-template').html()),
  header: 'Rankings',
  footerButtons: ['done'],
  events: {
    'click [data-action=done]': 'doneButton',
    'change #system': 'changeSystem'
  },
  initialize: function() {
  },
  render: function() {
    this.$el.html(this.template());
    this.$('#header h3').html(this.header);
    this.ratings = RatingSystems.currentRatings();
    this.$('#content').html(this.contentTemplate({ratings: this.ratings}));
    this.$('#footer').empty().append(this.buildFooter());
    this.showRatings(_.first(_.keys(this.ratings)));
  },
  doneButton: function() {
    router.navigate('', {trigger: true});
  },
  changeSystem: function(e) {
    this.showRatings($(e.target).val());
  },
  showRatings: function(system) {
    var ratings = this.ratings[system];
    var rankingsHtml = this.rankingsListTemplate({ratings: ratings});
    this.$('#ratings-list').html(rankingsHtml);
  }
});

var HistoryView = Backbone.View.extend({
  template: _.template($('#container-template').html()),
  contentTemplate: _.template($('#history-template').html()),
  header: 'History',
  footerButtons: ['done'],
  events: {
    'click [data-action=done]': 'doneButton'
  },
  initialize: function() {
  },
  render: function() {
    this.$el.html(this.template());
    this.$('#header h3').html(this.header);
    var history = RatingSystems.history();
    this.$('#content').html(this.contentTemplate({games:history}));
    this.$('#footer').empty().append(this.buildFooter());
  },
  doneButton: function() {
    router.navigate('', {trigger: true});
  }
});

var Router = Backbone.Router.extend({
  routes : {
    "" : "home",
    "new_game" : "newGame",
    "rankings" : "rankings",
    "history" : "history"
  },
  home : function() {
    this.loadView(new HomeView());
  },
  newGame : function() {
    this.loadView(new NewGameView());
  },
  rankings : function() {
    this.loadView(new RankingsView());
  },
  history : function() {
    this.loadView(new HistoryView());
  },
  loadView: function(view) {
    if (this.view) {
      this.view.remove();
      this.view.unbind();
    }
    this.view = view;
    this.view.render();
    $("#container").html(this.view.el);
  }
});

var router = new Router();
Backbone.history.start();
