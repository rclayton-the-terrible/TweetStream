var topNHidden = true;

var socket = io.connect("http://localhost:3000");

socket.on("tweets", function(update){

    var tweet = $.parseJSON(update);

     $("#content_latest_tweets")
         .prepend($("#latest_tweet").render(tweet));

     addTweeter(tweet.user);

     addMentions(tweet.mentioned);
});

socket.on("topnwords", function(update){

    var topNWords = $.parseJSON(update);

    var element;
    var linkFunction = createTweeterProfileUrl;

    if(topNWords.source == "tweet.words"){

        element = "#topn_tweet_words";
        linkFunction = createGoogleSearchUrl;
    }
    else if(topNWords.source == "tweet.users"){

        element = "#topn_tweeters";
    }
    else if(topNWords.source == "tweet.mentioned"){

        element = "#topn_mentions";
    }

    replaceContent(element, "#topn_list",
        { itemlist: transformToObject(topNWords, linkFunction) });

    drawChart(element.substring(1));

    if(topNHidden){
        topNHidden = false;

        $("#topN").slideDown();
    }
});

function transformToObject(topNWords, linkcreator){
    var rows = [];

    for(var i in topNWords.topWords){

        rows.push({
            name: i,
            url: linkcreator(i),
            count: topNWords.topWords[i] });
    }

    return _.sortBy(rows, function(row){ return row.count * -1; });
}

function addTweeter(tweeter){

    processTweeter(tweeter, "#content_tweeters", "#tweeter");
}

function addMentions(newMentions){

    if(newMentions.length == 0){ return; }

    for(mention in newMentions){
        processTweeter(newMentions[mention], "#content_mentions", "#mention");
    }

}

function processTweeter(tweeter, elementToInsertOn, template){
    tweeter.accountUrl = createTweeterProfileUrl(tweeter.accountName);
    prependContent(tweeter, elementToInsertOn, template);
}

function prependContent(tweeter, element, template){
    $(element)
        .prepend(
            $(template).render(tweeter));
}

function replaceContent(element, template, data){
    $(element)
        .html(
            $(template).render(data));
}

function createTweeterProfileUrl(twitterAccount){
    return "https://twitter.com/#!/" + twitterAccount;
}

function createGoogleSearchUrl(topic){
    return "https://www.google.com/search?q=" + topic;
}

function drawChart(element){

    // For horizontal bar charts, x an y values must will be "flipped"
    // from their vertical bar counterpart.
    $.jqplot(element, [
        [[2,1], [4,2], [6,3], [3,4]],
        [[5,1], [1,2], [3,3], [4,4]],
        [[4,1], [7,2], [1,3], [2,4]]], {
        seriesDefaults: {
            renderer:$.jqplot.BarRenderer,
            // Show point labels to the right ('e'ast) of each bar.
            // edgeTolerance of -15 allows labels flow outside the grid
            // up to 15 pixels.  If they flow out more than that, they
            // will be hidden.
            pointLabels: { show: true, location: 'e', edgeTolerance: -15 },
            // Rotate the bar shadow as if bar is lit from top right.
            shadowAngle: 135,
            // Here's where we tell the chart it is oriented horizontally.
            rendererOptions: {
                barDirection: 'horizontal'
            }
        },
        axes: {
            yaxis: {
                renderer: $.jqplot.CategoryAxisRenderer
            }
        }
    });

}


$(function(){
    var myOptions = {
      center: new google.maps.LatLng(39.75, -104.87),
      zoom: 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
});
