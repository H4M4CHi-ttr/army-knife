<template>
    <v-layout>
        <v-flex>
            <v-card>
                <v-card-text>
                    
                    <v-row>
                        <v-markup>
[Thu Jan 21 12:35:07 2016] [error] \xe6\x96\x87\xe5\xad\x97\xe5\x8c\x96\xe3\x81\x91\xe5\x8a\xa9\xe3\x81\x91\xe3\x81\xa6
                        </v-markup>

                    </v-row>

                    <v-row>
                    
                    <v-col md="6" sm="6" xs="12">
                    <v-textarea
                        label="デコードしたい文字列を入力"
                        v-model="target"
                        outlined
                        auto-grow
                        clearable
                    ></v-textarea>
                    </v-col>

                    <v-col md="6" sm="6" xs="12">
                    <v-textarea
                        label="デコード結果"
                        v-model="decoded"
                        filled
                        auto-grow
                        readonly
                    ></v-textarea>
                    </v-col>

                    </v-row>
                </v-card-text>
            </v-card>

        </v-flex>
    </v-layout>
</template>

<script>
export default {
    data () {
        return {
            title: "UTF-8 16進数デコード",
            target: "",
        }
    },

    head () {
        return {
            title: this.title,
        }
    },

    meta () {
        return {
            title: this.title,
        }
    },

    computed: {
        decoded: function(){
            var self = this;
			// \xff のような16進表記で連続する文字列について全て探し置換を行う
            // ※ (all)=>{...} は function(all){...} の省略表現
            if (self.target === null) return "";
			return self.target.replace(/(\\x[0-9a-fA-F]{2})+/g, (all)=>{
				// allが16進表記部分。これを整数の配列に変換する。
				var int_array = all
					// matchで16進数2桁部分を切り取り配列化
					.match(/[0-9a-fA-F]{2}/g)
					// 配列の各要素について16進数解釈で整数に変換する
					.map((e)=>{
						return parseInt('0x'+e)
					});
				// 8ビット符号なし整数の配列に変換し、
				var bytes = Uint8Array.from(int_array);
				// デコードしたら元の文字を再現できる
				var dc = new TextDecoder("utf-8");
				return dc.decode(bytes.buffer);
				// returnした値で、もとの文字列が置換される
            })
        }
    }
}
</script>