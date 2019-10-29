<template>
    <v-layout>
        <v-flex>
            <h1>VALUES生成</h1>

            <v-card>
                <v-card-text>
                    <v-textarea
                        v-model="target"
                        ></v-textarea>
                    
                    <p>
                        <v-radio-group v-model="delim_checked">
                            <v-radio value="auto" label="自動"></v-radio>
                            <v-radio v-for="item in delim_options" :value="item.value" :label="item.title"></v-radio>
                            <v-radio value="" label="その他"></v-radio>
                            <v-input v-show="delim_checked==''" v-model="delim_user" maxlength="1" />
                        </v-radio-group>
                    </p>

                    <v-textarea
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
			if (self.delim_checked == ""){ return self.delim_user; }
			else if (self.delim_checked == "auto"){
      	var sample = self.target.slice(0,200);
				var cnt = self.delim_options.map(e => {
					var reg = new RegExp("\\x"+e.value.charCodeAt().toString(16), "g");
					var mat = sample.match(reg)
					if (mat){
						return mat.length;
					}else{
						return 0;
					}
					
				});
				return self.delim_options[cnt.indexOf(Math.max.apply(null,cnt))].value
			}
			return self.delim_checked;
		},
	}
}
</script>