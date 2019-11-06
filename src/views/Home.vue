<template>
    <div class="home">
        <div id="header">GRE单词速背助手</div>
        <img alt="Vue logo" src="../assets/logo.png">
        <router-link to="/learn" class="start-button">开始</router-link>
    </div>
</template>

<script>
// @ is an alias to /src
export default {
  name: 'home',
  components: {}
}
</script>

<style scoped>
#header {
  width: 100%;
  color: #40BC96;
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  padding-top: 60px;
  padding-bottom: 70px;
}

.start-button {
  width: 200px;
  height: 60px;
  margin: 80px auto;
  background: #40BC96;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #FFFFFF;
  font-size: 20px;
  text-decoration: none;
}
</style>
