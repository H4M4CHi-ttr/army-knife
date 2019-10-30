<template>
    <v-layout>
        <v-flex>
            <h1>VALUES生成</h1>

            <v-card>
                <v-card-text>
                    <v-textarea
                        v-model="target"
                        ></v-textarea>
                    
                    <v-row align="center">
                        <v-radio-group v-model="delim_checked" row>
                            <v-radio value="auto" label="自動"></v-radio>
                            <v-radio v-for="item in delim_options" :value="item.value" :key="item.value">
								<template v-slot:label>
									{{ item.title }}
									<code class="ml-1">{{ item.value }}</code>
								</template>
							</v-radio>
                            <v-radio value="user" label="指定する"></v-radio>
                        </v-radio-group>
						<v-text-field
							label="区切り文字"
							hint="入力は1文字までです"
							:disabled="delim_checked!='user'"
							v-model="delim_user"
							maxlength="1"
							dense
						></v-text-field>
                    </v-row>

                    <v-textarea
						label="結果"
                        v-model="result" 
                        filled
                        readonly
                        ></v-textarea>
                </v-card-text>
            </v-card>
        </v-flex>
    </v-layout>
</template>

<script>
import * as d3 from "d3";

export default {
    data () {
        return {
            target: "a,10\nb,20",
		    rows: [],
		
		delim_options: [
			{title:"カンマ", value:","},
			{title:"タブ"  , value:"\t"},
			{title:"セミコロン"  , value:";"},
			{title:"バーティカルバー"  , value:"|"},
		],
		delim_checked: "auto",
		delim_user: "",
		
		nec_select: true,
        }
    },

    computed: {
		result () {
			var dsv = d3.dsvFormat(this.delim);
			var v_dsv = d3.dsvFormat(",");
			this.rows = dsv.parseRows(this.target);
			var res = "";
			for (var i=0; i < this.rows.length; i++){
				res += "('" + this.rows[i].join("','") + "'),\n";
			}
			res = res.replace(/,\n$/,"");
			return res;
		},
		
		delim () {
			var self = this;
			if (self.delim_checked == "auto" || (self.delim_checked == "user" && self.delim_user == "")){
				var sample = self.target.slice(0,200);
				var cnt = self.delim_options.map(e => {
					var reg = new RegExp("\\x"+("00"+e.value.charCodeAt().toString(16)).slice(-2), "g");
					var mat = sample.match(reg)
					if (mat){
						return mat.length;
					}else{
						return 0;
					}
					
				});
				return self.delim_options[cnt.indexOf(Math.max.apply(null,cnt))].value
			}
			else if (self.delim_checked == "user"){
				return self.delim_user ? self.delim_user : ",";
			}
			return self.delim_checked;
		},
	}
}
</script>