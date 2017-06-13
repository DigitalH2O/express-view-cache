function RedisMock() {
  this.store = {};
  this.set = function() {
    console.log('set');
  };
  this.get = function() {
    console.log('get')
  };
  this.expire = function() {
    console.log('expire')
  }
};

module.exports = RedisMock;