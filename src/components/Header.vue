<template>
    <div class="header">
        <div class="main">
            <div class="title">GRE 2 Weeks</div>
            <div class="user">
                <div>头像</div>
                <span>稍后开放</span>
                <img src="../assets/down.png" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
.header {
  position: absolute;
  top: 0;
  width: 100%;
  background: #40BC96;
  height: 80px;
}

.main {
  max-width: 1300px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 32px;
  font-weight: bolder;
  cursor: pointer;
  color: #FFFFFF;
  padding: 0 10px;
  box-sizing: border-box;
  font-family: Calibri, sans-serif;
}

.user {
  height: 100%;
  display: flex;
  align-items: center;
  padding-right: 10px;
}

.user div {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  letter-spacing: 0.5px;
  font-weight: 600;
  background: #065279;
  color: #FFFFFF;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, .24);
}

.user span {
  font-size: 13px;
  color: #FFFFFF;
  font-weight: 600;
  margin-left: 12px;
}

.user img {
  margin-left: 8px;
  width: 15px;
  height: 15px;
}
</style>
