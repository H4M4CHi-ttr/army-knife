<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-flex
      xs12
      sm8
      md6
    >
      <div class="text-center">
        <logo />
        <vuetify-logo />
      </div>
      <v-card>
        <v-card-title class="headline">
          ようこそVueとNuxtの世界へ
        </v-card-title>
        <v-card-text>
          <p>
            Javascriptでテキスト加工を中心とする様々なツールを作ってみるプロジェクトです。
          </p>
          <p>
            フロントエンドフレームワークにはVue.js、流行りのサーバサイドレンダリング(SSR)、シングルページアプリケーション(SPA)の構成にNuxt.jsを使用しています。
          </p>
          <a
            href="https://github.com/H4M4CHi-ttr/army-knife"
            target="_blank"
          >
            プロジェクト (GitHub)
          </a>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import Logo from '~/components/Logo.vue'
import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
  components: {
    Logo,
    VuetifyLogo
  }
}
</script>
