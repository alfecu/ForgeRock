/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/*global java*/
/*global exception*/
function format() {
    var sw, pw;
    sw = new java.io.StringWriter();
    pw = new java.io.PrintWriter(sw);
    exception.printStackTrace(pw);
    return sw.toString();
}
format();
