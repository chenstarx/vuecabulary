<template>
    <div id="app">
        <Header />
        <router-view/>
    </div>
</template>

<script>
import Header from '@/components/Header.vue'

// @ is an alias to /src
export default {
  name: 'learn',
  components: {
    Header
  }
}
</script>

<style>
body {
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  user-select: none;
}
</style>
