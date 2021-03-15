<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/строка">
    <html>

    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width" />
      <script id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/mml-svg.js"></script>
      <title>MathML</title>
    </head>

    <body>
      <div class="wrap">
        <div class="math">

          <math display="block">
            <mrow>
              <mi><xsl:value-of select="операнд"/></mi>
              <mo><xsl:value-of select="оператор"/></mo>
            </mrow>

            <mrow>
              <msqrt>
                <mfrac>
                  <mn><xsl:value-of select="корень/строка/дробь/строка/число"/></mn>
                  <mi><xsl:value-of select="корень/строка/дробь/строка/операнд"/></mi>
                </mfrac>
                <munderover>
                  <mo><xsl:value-of select="(корень/строка/строка/низверх/строка)[1]/оператор"/></mo>
                  <mrow>
                    <mi><xsl:value-of select="(корень/строка/строка/низверх/строка/операнд)[1]"/></mi>
                    <mo><xsl:value-of select="(корень/строка/строка/низверх/строка)[2]/оператор"/></mo>
                    <mn><xsl:value-of select="(корень/строка/строка/низверх/строка)[2]/число"/></mn>
                  </mrow>
                  <mi><xsl:value-of select="(корень/строка/строка/низверх/строка)[3]/операнд"/></mi>
                </munderover>
                <msup>
                  <mrow>
                    <mo><xsl:value-of select="(корень/строка/строка/строка/верх/строка)[1]/оператор[1]"/></mo>
                    <msub>
                      <mi>x</mi>
                      <mi>i</mi>
                    </msub>
                    <mo><xsl:value-of select="(корень/строка/строка/строка/верх/строка)[1]/оператор[2]"/></mo>
                    <mi><xsl:value-of select="(корень/строка/строка/строка/верх/строка)[1]/операнд"/></mi>
                    <mo><xsl:value-of select="(корень/строка/строка/строка/верх/строка)[1]/оператор[3]"/></mo>
                  </mrow>
                  <mn><xsl:value-of select="(корень/строка/строка/строка/верх/строка)[2]"/></mn>
                </msup>
              </msqrt>
            </mrow>
            <mi><xsl:value-of select="оператор[2]"/></mi>
          </math>

        </div>
      </div>

    </body>

    <style type="text/css" media="screen">
      .wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
      }

      .math {
        font-size: 18pt;
      }
    </style>

    </html>


  </xsl:template>
</xsl:stylesheet>
